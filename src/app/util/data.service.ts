import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventEmitter, Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Octokit } from '@octokit/rest';
import { LocalStorageService, LocStorageKeys } from './local-storage.service';
import { IsLoadingService } from '@service-work/is-loading';
import { MyCrypto } from './mycrypto';
import { Clipboard } from '@angular/cdk/clipboard';

import { PasswordDialogComponent } from '../shared/components/password-dialog/password-dialog.component'; 
import { FileUpdateService } from './file-update.service';
import { MessagesService } from './messages.service';
import { ConfigFile } from '../model/config-file';
import { ProjectFile } from '../model/project-file';
import { ThreatOriginTypes } from '../model/threat-model';
import { SaveDialogComponent } from '../shared/components/save-dialog/save-dialog.component';
import { ITwoOptionDialogData, TwoOptionsDialogComponent } from '../shared/components/two-options-dialog/two-options-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { DiagramTypes } from '../model/diagram';

import { v4 as uuidv4 } from 'uuid';
import { saveAs } from 'file-saver';
import { StringExtension } from './string-extension';


import { APP_CONFIG } from '../../environments/environment';
import { MatDialog } from '@angular/material/dialog';

import versionFile from '../../assets/version.json';
import { ElectronService } from '../core/services';

export interface IGHRepository {
  id: number;
  name: string;
  owner: string;
  url: string;
  updated: Date;
  private: boolean;
  isWritable: boolean;
}

export interface IGHFile {
  repoId: number;
  name: string;
  path: string;
  sha: string;
  isEncrypted: boolean;
}

export interface IGHFileContent {
  content: string;
  encrypted?: string;
}

export interface IGHCommitInfo {
  commiter: string;
  message: string;
  date: string;
  sha: string;
}

export enum UserModes {
  None,
  Guest,
  LoggedIn
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private hasSpellCheck: boolean = null;

  private userMode: UserModes = UserModes.None;
  private userName: string;
  private userAccount: string;
  private userURL: string;
  private userEmail: string;
  private accessToken: string;
  private repos: IGHRepository[] = [];
  private availableGHProjects: IGHFile[] = [];
  private availableGHConfigs: IGHFile[] = [];
  private selectedGHProject: IGHFile;
  private selectedGHConfig: IGHFile;

  private projectContentCrypto: MyCrypto;

  private unsavedChangesTimer: NodeJS.Timer;
  private unsavedChangesMinutes: number;

  private project: ProjectFile;
  private config: ConfigFile;

  constructor(private locStorage: LocalStorageService, private isLoading: IsLoadingService, private http: HttpClient, private router: Router, private clipboard: Clipboard,
    private dialog: MatDialog, private messagesService: MessagesService, private translate: TranslateService, private fileUpdate: FileUpdateService, private zone: NgZone, private electron: ElectronService) { 
    this.restoreUserAccount();
    if (this.UserMode == UserModes.LoggedIn) {
      this.retrieveRepositories();
    }

    this.Config = ConfigFile.DefaultFile();

    setTimeout(() => {
      const octokit = new Octokit();
      octokit.repos.listReleases({ owner: 'SecSimon', repo: 'TTM' }).then(({data}) => {
      const isNewVersion = (tag: string): boolean => {
        const currArr = versionFile.version.replace('v', '').split('.');
        const tagArr = tag.replace('v', '').split('.');

        if (currArr.length == tagArr.length) {
          for (let i = 0; i < currArr.length; i++) {
            if (tagArr[i] > currArr[i]) return true;
          }
        }

        return false;
      };
      
      const newerVersion = data.find(x => isNewVersion(x.tag_name));
      if (newerVersion) {
        this.messagesService.Info('messages.info.newVersion');
      }
    });
    }, 12000);
    
    if (this.electron.isElectron && this.electron.ipcRenderer) {
      this.electron.ipcRenderer.on('onsave', () => {
        this.Save();
      });
    }
  }

  public get UserMode(): UserModes { return this.userMode; }
  public get IsLoggedIn(): boolean { return this.UserMode == UserModes.LoggedIn; }
  public get IsGuest(): boolean { return this.UserMode == UserModes.Guest; }
  public get KeepUserSignedIn(): boolean { 
    let keep = this.locStorage.Get(LocStorageKeys.AUTH_KEEP_SIGNED_IN);
    if (keep == null) {
      this.locStorage.Set(LocStorageKeys.AUTH_KEEP_SIGNED_IN, String(true));
      return true;
    }
    return keep == 'true'; 
  }
  public set KeepUserSignedIn(val: boolean) {
    this.locStorage.Set(LocStorageKeys.AUTH_KEEP_SIGNED_IN, String(val));
  }
  public get UserName(): string { return this.userName; }
  public get UserAccount(): string { return this.userAccount; }
  public get UserURL(): string { return this.userURL; }
  public get UserEmail(): string { return this.userEmail; }
  public get UserDisplayName(): string { return this.UserName ? this.UserName : this.UserAccount }

  public get Repos(): IGHRepository[] { return this.repos; }
  public get AvailableGHProjects(): IGHFile[] { return this.availableGHProjects; }
  public get AvailableGHConfigs(): IGHFile[] { return this.availableGHConfigs; }
  public get SelectedGHProject(): IGHFile { return this.selectedGHProject; }
  public get SelectedGHConfig(): IGHFile { return this.selectedGHConfig; }

  public get HasProject(): boolean { return this.Project != null; }
  public get Project(): ProjectFile {
    return this.project;
  }
  public set Project(val: ProjectFile) {
    if (this.project != val) {
      this.project = val;
      if (val) {
        this.Config = val.Config;
        this.Config.ProjectFile = val;
        this.project.DataChanged.subscribe(() => {
          this.startUnsavedChangesTimer();
        });
      }
      else {
        this.stopUnsavedChangesTimer();
      }
      this.ProjectChanged.emit(val);
    }
  }

  public get Config(): ConfigFile { return this.config; }
  public set Config(val: ConfigFile) {
    this.config = val;
    this.ConfigChanged.emit(val);
  }

  public get CanSaveProject(): boolean {
    return this.SelectedGHProject != null && this.GetRepoOfFile(this.SelectedGHProject).isWritable;
  }

  public get CanSaveConfig(): boolean {
    return this.SelectedGHConfig != null && this.GetRepoOfFile(this.SelectedGHConfig).isWritable;
  }

  public get HasUnsavedChanges(): boolean {
    if (this.Project) return this.Project.FileChanged;
    return this.Config?.FileChanged;
  }

  public get HasSpellCheck(): boolean {
    if (this.hasSpellCheck == null) {
      const val = this.locStorage.Get(LocStorageKeys.SPELL_CHECK);
      this.hasSpellCheck = val == 'true' || val == null;
    }
    return this.hasSpellCheck;
  }
  public set HasSpellCheck(val: boolean) {
    this.hasSpellCheck = val;
    this.locStorage.Set(LocStorageKeys.SPELL_CHECK, String(val));
  }

  public ProjectChanged = new EventEmitter<ProjectFile>();
  public ProjectSaved = new EventEmitter<ProjectFile>();
  public ConfigChanged = new EventEmitter<ConfigFile>();

  private isLoggingIn = false;
  public LogIn(code: string) {
    if (this.isLoggingIn) return;
    if (this.locStorage.Get(LocStorageKeys.AUTH_LAST_CODE) == code) {
      return;
    }

    try {
      this.isLoggingIn = true;
      this.isLoading.add();
      this.clearLoginData();
      const requestOptions: Object = {
        headers: new HttpHeaders({ 'Content-Type': 'text/plain' }),
        responseType: 'text'
      }
      this.http.post<string>('https://1tvzjyylrh.execute-api.us-east-2.amazonaws.com/default/GithubAuthHandler', JSON.stringify({ 'code': code }), requestOptions).subscribe((res) => {
        if (res.includes('access_token')) {
          this.accessToken = res.split('&')[0].split('=')[1];
          this.userMode = UserModes.LoggedIn;
          if (this.KeepUserSignedIn) {
            this.locStorage.Set(LocStorageKeys.AUTH_ACCESS_TOKEN, this.accessToken);
            this.locStorage.Set(LocStorageKeys.AUTH_LAST_CODE, code);
          }
          this.messagesService.Success('messages.success.githubauth');
          this.retrieveUser();
        }
        else {
          this.messagesService.Error('messages.error.githubauth', res);
        }
        this.isLoading.remove();
        this.isLoggingIn = false;
      },
      (err) => { 
        this.messagesService.Error('messages.error.githubauth', err);
        this.isLoading.remove();
        this.isLoggingIn = false;
      });
    } catch (error) {
      this.messagesService.Error('messages.error.githubauth', error);
      this.isLoading.remove();
      this.isLoggingIn = false;
    }
  }

  public GuestLogin() {
    this.userMode = UserModes.Guest;
    this.retrieveRepositories();
    this.router.navigate(['/']);
  }

  public LogOut() {
    this.OnCloseProject().then(() => {
      this.clearLoginData();
      this.messagesService.Info('messages.info.logout');
      this.router.navigate(['/']);
    });
  }

  private clearLoginData() {
    this.locStorage.Remove(LocStorageKeys.AUTH_ACCESS_TOKEN);
    this.locStorage.Remove(LocStorageKeys.AUTH_LAST_CODE);
    this.locStorage.Remove(LocStorageKeys.GH_ACCOUNT_NAME);
    this.locStorage.Remove(LocStorageKeys.GH_USER_NAME);
    this.locStorage.Remove(LocStorageKeys.GH_USER_URL);
    this.userMode = UserModes.None;
    this.userAccount = this.userName = this.accessToken = this.userURL = '';
  }

  public NewProject() {
    this.selectedGHProject = null;

    if (this.UserMode == UserModes.LoggedIn) {
      let data = { 'msg': 'Created new project' };
      if (!this.SelectedGHProject) {
        data['newProject'] = { name: '', configFile: null, path: '', repoId: null, isEncrypted: false, sha: null } as IGHFile;
      }
      else if (this.SelectedGHProject?.isEncrypted) data['removePW'] = false;
      const dialogRef = this.dialog.open(SaveDialogComponent, { hasBackdrop: false, data: data });
      dialogRef.afterClosed().subscribe(res => {
        if (res) {
          let createProject = (cfg: ConfigFile) => {
            cfg.Data['ID'] == uuidv4();
            let proj = new ProjectFile({}, cfg);
            proj.InitializeNewProject();
            //let dev = proj.CreateDevice();
            proj.CreateDiagram(DiagramTypes.DataFlow);
  
            this.Project = proj;
  
            if (!APP_CONFIG.production) {
              setTimeout(() => {
                let pStr = JSON.stringify(this.Project.ToJSON());
                let cObj = ProjectFile.FromJSON(JSON.parse(pStr));
                let cStr = JSON.stringify(cObj.ToJSON());
                if (pStr !== cStr) {
                  console.error('Database serialization failed');
                  console.log(this.Project.ToJSON());
                  console.log(cObj.ToJSON());
                }
              }, 100);
            }
            this.SaveProject(data.msg, data['removePW'] != null ? data['removePW'] : false, data['pw'] != null ? data['pw'] : null, data['newProject'] ? data['newProject'] : null);
          };
  
          let cfg: ConfigFile = this.config;
          if (data['newProject']['configFile'] == null) createProject(ConfigFile.DefaultFile());
          else {
            let conf = data['newProject']['configFile'] as IGHFile;
            this.isLoading.add();
            const octokit = new Octokit({ auth: this.accessToken });
            octokit.repos.getContent(
            {
              owner: this.GetRepoOfFile(conf).owner,
              repo: this.GetRepoOfFile(conf).name,
              path: conf.path
            }).then(({ data }) => {
              let confContent = JSON.parse(Buffer.from(data['content'], 'base64').toString()) as IGHFileContent;
              cfg = ConfigFile.FromJSON(JSON.parse(confContent.content));
              createProject(cfg);
            }).catch((err) => {
              this.messagesService.Error('messages.error.githubfetch', err);
            }).finally(() => {
              this.isLoading.remove();
            });
          }
        }
      });
    }
    else {
      const cfg = ConfigFile.DefaultFile();
      cfg.Data['ID'] = uuidv4();
      let proj = new ProjectFile({}, cfg);
      proj.InitializeNewProject();
      //let dev = proj.CreateDevice();
      proj.CreateDiagram(DiagramTypes.DataFlow);

      this.Project = proj;
      this.locStorage.Remove(LocStorageKeys.GH_LAST_PROJECT);
    }
  }

  public Save() {
    if (this.Project) return this.OpenSaveProjectDialog('');
    else if (this.UserMode == UserModes.LoggedIn) return this.OpenSaveConfigDialog('');
  }

  public OpenSaveProjectDialog(msg: string, saveAs: boolean = false) {
    return new Promise<void>((resolve, reject) => {
      if (this.CanSaveProject) {
        let data = { 'msg': msg };
        if (!this.SelectedGHProject || saveAs) {
          data['newProject'] = { name: '', configFile: null, path: '', repoId: null, isEncrypted: false, sha: null } as IGHFile;
        }
        else if (this.SelectedGHProject?.isEncrypted) data['removePW'] = false;
        const dialogRef = this.dialog.open(SaveDialogComponent, { hasBackdrop: false, data: data });
        dialogRef.afterClosed().subscribe(res => {
          if (res) {
            this.SaveProject(data.msg, data['removePW'] != null ? data['removePW'] : false, data['pw'] != null ? data['pw'] : null, data['newProject'] ? data['newProject'] : null).then(() => resolve()).catch(() => reject());
          }
          else resolve();
        });
      }
      else {
        this.ExportFile(true);
        resolve();
      }
    });
  }

  public OpenSaveConfigDialog(msg: string, saveAs: boolean = false) {
    return new Promise<void>((resolve, reject) => {
      let data = { 'msg': msg };
      if (!this.SelectedGHConfig || saveAs) {
        data['newConfig'] = { name: '', path: '', repoId: null, isEncrypted: false, sha: null } as IGHFile;
      }
      const dialogRef = this.dialog.open(SaveDialogComponent, { hasBackdrop: false, data: data });
      dialogRef.afterClosed().subscribe(res => {
        if (res) {
          this.SaveConfig(data.msg, data['newConfig'] ? data['newConfig'] : null).then(() => resolve()).catch(() => reject());
        }
        else resolve();
      });
    });
  }

  public LoadProject(proj: IGHFile) {
    this.OnCloseProject().then(() => {

      // check for outdated file
      const lastProject = this.locStorage.Get(LocStorageKeys.GH_LAST_PROJECT);
      if (lastProject) {
        const parsedLastProject = JSON.parse(lastProject);
        const repo = this.GetRepoOfFile(proj);
        if (repo.owner == parsedLastProject['owner'] && proj.repoId == parsedLastProject['repoId'] && proj.path == parsedLastProject['path']) {
          // same as last project
          if (proj.sha != parsedLastProject['sha']) {
            this.messagesService.Error('messages.error.githuboutdatedfile');
            return;
          }
        }
      }

      this.isLoading.add();
      this.selectedGHProject = proj;
      const octokit = this.UserMode == UserModes.LoggedIn ? new Octokit({ auth: this.accessToken }) : new Octokit();
      octokit.git.getBlob({ owner: this.GetRepoOfFile(proj).owner, repo: this.GetRepoOfFile(proj).name, file_sha: proj.sha }).then(({ data }) => {
        let projContent = JSON.parse(Buffer.from(data['content'], 'base64').toString()) as IGHFileContent;
        
        if ('encrypted' in projContent) {
          proj.isEncrypted = true;
          this.loadEncryptedProject(proj, projContent);
        }
        else {
          this.loadProjectFile(proj.name, JSON.parse(projContent.content));
        }
      }).catch((err) => {
        this.messagesService.Error('messages.error.githubfetch', err);
      }).finally(() => {
        this.isLoading.remove();
      });
    });
  }

  public ReloadProject() {
    const curr = this.SelectedGHProject;
    this.OnCloseProject().then(() => {
      this.LoadProject(curr);
    });
  }

  public RestoreCommit(commit: IGHCommitInfo) {
    const octokit = this.UserMode == UserModes.LoggedIn ? new Octokit({ auth: this.accessToken }) : new Octokit();
    const proj = this.SelectedGHProject;
    
    octokit.repos.getCommit({ owner: this.GetRepoOfFile(proj).owner, repo: this.GetRepoOfFile(proj).name, ref: commit.sha }).then(({ data }) => {
      if (data.files?.length == 1 && data.files[0].filename == this.SelectedGHProject.path) {
        const oldFile = JSON.parse(JSON.stringify(this.SelectedGHProject)) as IGHFile;
        oldFile.sha = data.files[0].sha;
        this.LoadProject(oldFile);
      }
    });
  }

  public OnClose(event) {
    if (this.Project?.FileChanged || this.Config?.FileChanged) {
      this.zone.run(() => this.OnCloseProject());
      event.returnValue = false;
      return false;
    }
  }

  first = false;

  private loadEncryptedProject(proj: IGHFile, projContent: IGHFileContent) {
    let pw = { 'pw': '' };
    this.isLoading.add();
    const dialogRef = this.dialog.open(PasswordDialogComponent, { hasBackdrop: false, data: pw });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        try {
          this.projectContentCrypto = new MyCrypto(pw.pw);
          const keycheck = this.projectContentCrypto.Decrypt(projContent.encrypted);
          projContent.content = JSON.parse(this.projectContentCrypto.Decrypt(projContent.content));
          delete projContent['encrypted'];
          this.loadProjectFile(proj.name, JSON.parse(projContent.content));
        } 
        catch (error) {
          this.messagesService.Warning('messages.warning.wrongPassword');
          this.loadEncryptedProject(proj, projContent);
        }
        finally {
          this.isLoading.remove();
        }
      }
      else {
        this.isLoading.remove();
      }
    });
  }

  private loadProjectFile(name: string, json: any) {
    try {
      let updated = this.fileUpdate.UpdateProjectFile(json);
      this.Project = ProjectFile.FromJSON(json);
      this.Project.FileChanged = updated;
      this.Config = this.Project.Config;
      this.selectedGHConfig = null;
      if (this.KeepUserSignedIn && this.selectedGHProject) this.locStorage.Set(LocStorageKeys.GH_LAST_PROJECT, JSON.stringify({ owner: this.GetRepoOfFile(this.SelectedGHProject).owner, repoId: this.SelectedGHProject.repoId, path: this.SelectedGHProject.path, sha: this.SelectedGHProject.sha }));
      this.messagesService.Success('messages.success.loadProject', name);
    } 
    catch (error) {
      this.messagesService.Error(error);
    }
  }

  private getFileContent(json, beautify: boolean, encrypt: boolean, password: string = null): string {
    this.isLoading.add();
    if (this.selectedGHProject) this.selectedGHProject.isEncrypted = encrypt;

    let file: IGHFileContent = {
      content: beautify ? JSON.stringify(json, null, 2) : JSON.stringify(json)
    };
    if (encrypt) {
      if (password) this.projectContentCrypto = new MyCrypto(password);
      let tmpFile: IGHFileContent = JSON.parse(JSON.stringify(file));
      file.content = this.projectContentCrypto.Encrypt(JSON.stringify(tmpFile.content));
      file.encrypted = this.projectContentCrypto.Encrypt(this.projectContentCrypto.GetRandom(16).toString('base64'));
    }

    const res = JSON.stringify(file);
    this.isLoading.remove();
    return res;
  }

  public SaveProject(commitMsg: string, removePassword = false, password: string = null, ghProject: IGHFile = null) {
    this.isLoading.add();
    if (ghProject != null) this.selectedGHProject = ghProject;
    if (commitMsg.length == 0) commitMsg = 'Update';
    if (this.selectedGHProject) this.Project.Name = this.selectedGHProject.name;

    let content = this.getFileContent(this.Project.ToJSON(), false, (password != null || this.selectedGHProject.isEncrypted) && !removePassword, password);
    const octokit = new Octokit({ auth: this.accessToken });
    return octokit.rest.repos.createOrUpdateFileContents({
      owner: this.GetRepoOfFile(this.SelectedGHProject).owner,
      repo: this.GetRepoOfFile(this.SelectedGHProject).name,
      path: this.SelectedGHProject.path,
      message: commitMsg,
      content: Buffer.from(content).toString('base64'),
      sha: this.SelectedGHProject.sha,
      committer: {
        name: this.UserAccount,
        email: this.UserEmail
      }
    })
    .then(({ data: res }) => {
      this.selectedGHProject.sha = res.content.sha;
      this.messagesService.Success('messages.success.saveProject', this.SelectedGHProject.name);
      if (ghProject) this.availableGHProjects.push(ghProject);
      if (this.KeepUserSignedIn && this.selectedGHProject) this.locStorage.Set(LocStorageKeys.GH_LAST_PROJECT, JSON.stringify({ owner: this.GetRepoOfFile(this.SelectedGHProject).owner, repoId: this.SelectedGHProject.repoId, path: this.SelectedGHProject.path, sha: this.SelectedGHProject.sha }));
      this.ProjectSaved.emit(this.Project);
      setTimeout(() => {
        if (this.Project) this.Project.FileChanged = false;
        if (this.Config) this.Config.FileChanged = false;
      }, 500);
      this.stopUnsavedChangesTimer();
    }).catch((err) => {
      if (err.status == 409 && err.message.includes('does not match')) {
        this.messagesService.Error('messages.error.githubSHAmismatch');
      }
      else {
        this.messagesService.Error('messages.error.githubpush', err);
      }
    }).finally(() => this.isLoading.remove());
  }

  public LoadConfig(conf: IGHFile) {
    this.OnCloseProject().then(() => {
      this.isLoading.add();
      this.selectedGHConfig = conf;
      const octokit = new Octokit({ auth: this.accessToken });
      octokit.repos.getContent(
      {
        owner: this.GetRepoOfFile(conf).owner,
        repo: this.GetRepoOfFile(conf).name,
        path: conf.path
      }).then(({ data }) => {
        let confContent = JSON.parse(Buffer.from(data['content'], 'base64').toString()) as IGHFileContent;
  
        this.loadConfigFile(conf.name, JSON.parse(confContent.content));
      }).catch((err) => {
        this.messagesService.Error('messages.error.githubfetch', err);
      }).finally(() => {
        this.isLoading.remove();
      });
    });
  }

  public ReloadConfig() {
    const curr = this.SelectedGHConfig;
    this.OnCloseConfig().then(() => {
      if (curr) this.LoadConfig(curr);
    });
  }

  private loadConfigFile(name: string, json: any) {
    try {
      let updated = this.fileUpdate.UpdateConfigFile(json);
      this.Config = ConfigFile.FromJSON(json);
      this.Config.FileChanged = updated;
      this.Project = this.selectedGHProject = null;
      this.messagesService.Success('messages.success.loadConfig', name);
    } 
    catch (error) {
      this.messagesService.Error(error);
    }
  }

  public SaveConfig(commitMsg: string, ghConfig: IGHFile = null) {
    this.isLoading.add();
    if (ghConfig != null) this.selectedGHConfig = ghConfig;
    if (commitMsg.length == 0) commitMsg = 'Update';
    if (this.selectedGHConfig) this.Config.Name = this.selectedGHConfig.name;

    let content = this.getFileContent(this.Config.ToJSON(), false, false);
    this.selectedGHConfig.isEncrypted = false;
    const octokit = new Octokit({ auth: this.accessToken });
    return octokit.rest.repos.createOrUpdateFileContents({
      owner: this.GetRepoOfFile(this.SelectedGHConfig).owner,
      repo: this.GetRepoOfFile(this.SelectedGHConfig).name,
      path: this.SelectedGHConfig.path,
      message: commitMsg,
      content: Buffer.from(content).toString('base64'),
      sha: this.SelectedGHConfig.sha,
      committer: {
        name: this.UserAccount,
        email: this.UserEmail
      }
    })
    .then(({ data: res }) => {
      this.Config.FileChanged = false;
      this.selectedGHConfig.sha = res.content.sha;
      this.messagesService.Success('messages.success.saveConfig', this.SelectedGHConfig.name);
      if (ghConfig) this.availableGHConfigs.push(ghConfig);
    }).catch((err) => {
      if (err.status == 409 && err.message.includes('does not match')) {
        this.messagesService.Error('messages.error.githubSHAmismatch');
      }
      else {
        this.messagesService.Error('messages.error.githubpush', err);
      }
    }).finally(() => this.isLoading.remove());
  }

  public DeleteGHFile(file: IGHFile) {
    this.isLoading.add();
    const octokit = new Octokit({ auth: this.accessToken });
    octokit.rest.repos.deleteFile({
      owner: this.GetRepoOfFile(file).owner,
      repo: this.GetRepoOfFile(file).name,
      path: file.path,
      message: 'Delete file ' + file.name,
      sha: file.sha,
      committer: {
        name: this.UserAccount,
        email: this.UserEmail
      }
    })
    .then(({ data: res }) => {
      this.messagesService.Success('messages.success.githubdelete', file.name);
      if (file == this.SelectedGHProject) {
        let lp = JSON.parse(this.locStorage.Get(LocStorageKeys.GH_LAST_PROJECT));
        if (lp['owner'] == this.GetRepoOfFile(this.SelectedGHProject).owner && lp['repoId'] == this.SelectedGHProject.repoId && lp['path'] == this.SelectedGHProject.path) {
          this.locStorage.Remove(LocStorageKeys.GH_LAST_PROJECT);
        }
        this.selectedGHProject = null;
        this.Project = null;
      }
      else if (file == this.selectedGHConfig) {
        this.selectedGHConfig = null;
        this.Config = ConfigFile.DefaultFile();
      }
      if (this.availableGHProjects.includes(file)) this.availableGHProjects.splice(this.availableGHProjects.indexOf(file), 1);
      else if (this.availableGHConfigs.includes(file)) this.availableGHConfigs.splice(this.availableGHConfigs.indexOf(file), 1);
    }).catch((err) => {
      this.messagesService.Error('messages.error.githubdelete', err);
      console.error(err);
    }).finally(() => this.isLoading.remove());
  }

  public ExportFile(isProject: boolean) {
    let content = '';
    let name = '';
    if (isProject && this.Project) {
      content = this.getFileContent(this.Project.ToJSON(), true, this.SelectedGHProject ? this.SelectedGHProject.isEncrypted : false);
      if (this.SelectedGHProject) name = this.SelectedGHProject.name;
      else name = 'Project.ttmp';
    }
    else if (this.Config) {
      content = this.getFileContent(this.Config.ToJSON(), true, false);
      if (this.SelectedGHConfig) name = this.SelectedGHConfig.name;
      else if (this.SelectedGHProject) name = this.selectedGHProject.name.replace('.ttmp', '.ttmc');
      else name = 'Config.ttmc';
    }
    
    if (content.length > 0) {
      const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
      let now = new Date();
      let names = name.split('.');
      let date = [now.getFullYear(), now.getMonth()+1, now.getDate()];
      let time = [now.getHours(), now.getMinutes(), now.getSeconds()];
      let leading0 = (num: number, length: number = 2): string => {
        let val = num.toString();
        while(val.length < length) val = '0' + val;
        return val;
      };
      names.splice(1, 0, ...['_', ...date.map(x => leading0(x)), '_', ...time.map(x => leading0(x)), '.']);
      saveAs(blob, names.join(''));
    }
  }

  public ImportFile(isProject: boolean, fileInput: any) {
    if (fileInput.target.files && fileInput.target.files[0]) {
      const reader = new FileReader();
      const fileName = fileInput.target.files[0].name;
      reader.onload = (e) => {
        const fileRes = reader.result;
        const file = JSON.parse(fileRes.toString());
        if ('content' in file) {
          const content = file['content'];
          const json = JSON.parse(content);
          this.selectedGHConfig = this.selectedGHProject = null;
          if (isProject) {
            this.loadProjectFile(json['Data']['Name'], json);
            this.Project.FileChanged = true;
          }
          else {
            this.loadConfigFile(fileName.replace('.ttmc', ''), json);
            this.Config.FileChanged = true;
          }
        }
        else {
          this.messagesService.Error('Unsupported file');
        }
      };

      reader.readAsText(fileInput.target.files[0]);
    }
  }

  public ExchangeConfig(conf: IGHFile) {
    this.exchangeConfigDialog().subscribe(res => {
      if (res) {
        const octokit = new Octokit({ auth: this.accessToken });
        octokit.repos.getContent(
        {
          owner: this.GetRepoOfFile(conf).owner,
          repo: this.GetRepoOfFile(conf).name,
          path: conf.path
        }).then(({ data }) => {
          let confContent = JSON.parse(Buffer.from(data['content'], 'base64').toString()) as IGHFileContent;

          let configJSON = JSON.parse(confContent.content);
          this.fileUpdate.UpdateConfigFile(configJSON);
          let proj = this.Project.ToJSON();
          proj.config = configJSON;
          this.Project = ProjectFile.FromJSON(proj);

          this.messagesService.Info('messages.info.exchangeConfig');
        }).catch((err) => {
          this.closeProject();
          this.messagesService.Error('messages.error.githubfetch', err);
        }).finally(() => {
          this.isLoading.remove();
        });
      }
    });
  }

  public ExchangeConfigWithDefault() {
    this.exchangeConfigDialog().subscribe(res => {
      if (res) {
        let newConfig = ConfigFile.DefaultFile().ToJSON();
        this.fileUpdate.UpdateConfigFile(newConfig);
        let proj = this.Project.ToJSON();
        proj.config = newConfig;
        this.Project = ProjectFile.FromJSON(proj);
        this.messagesService.Info('messages.info.exchangeConfig');
      }
    });
  }

  private exchangeConfigDialog() {
    let data: ITwoOptionDialogData = {
      title: this.translate.instant('dialog.configexchange.title'),
      textContent: this.translate.instant('dialog.configexchange.desc'),
      resultTrueText: this.translate.instant('general.Yes'),
      hasResultFalse: true,
      resultFalseText: this.translate.instant('general.No'),
      resultTrueEnabled: () => { return true; },
      initalTrue: false
    };
    return this.dialog.open(TwoOptionsDialogComponent, { hasBackdrop: false, data: data }).afterClosed();
  }

  public GetProjectHistory() {
    return new Promise<IGHCommitInfo[]>((resolve, reject) => {
      let res: IGHCommitInfo[] = [];
      if (this.SelectedGHProject) {
        const octokit = this.UserMode == UserModes.LoggedIn ? new Octokit({ auth: this.accessToken }) : new Octokit();
        const proj = this.SelectedGHProject;
        octokit.repos.listCommits({owner: this.GetRepoOfFile(proj).owner, repo: this.GetRepoOfFile(proj).name, path: proj.path }).then(({ data }) => {
          data.forEach(x => {
            res.push({ commiter: x.commit.committer.name, message: x.commit.message, date: x.commit.committer.date, sha: x.sha });
          });
          resolve(res);
        }).catch(() => reject());
      }
      else resolve(res);
    });
  }

  public OnCloseProject() {
    return new Promise<void>((resolve, reject) => {
      if (this.Project?.FileChanged) {
        let data: ITwoOptionDialogData = {
          title: this.translate.instant('dialog.unsaved.title'),
          textContent: this.translate.instant('dialog.unsaved.saveProject'),
          resultTrueText: this.translate.instant('general.Yes'),
          hasResultFalse: true,
          resultFalseText: this.translate.instant('general.No'),
          resultTrueEnabled: () => { return true; },
          initalTrue: true
        };
        const dialogRef = this.dialog.open(TwoOptionsDialogComponent, { hasBackdrop: false, data: data });
        dialogRef.afterClosed().subscribe(res => {
          if (res) {
            if (this.UserMode == UserModes.LoggedIn) {
              this.OpenSaveProjectDialog('').then(() => {
                this.closeProject();
                resolve();
              })
              .catch(() => reject());
            }
            else if (this.UserMode == UserModes.Guest) {
              this.ExportFile(true);
              this.closeProject();
              resolve();
            }
          }
          else {
            this.closeProject();
            resolve();
          }
        });
      }
      else {
        this.closeProject();
        resolve();
      }
    });
  }

  public OnCloseConfig() {
    return new Promise<void>((resolve, reject) => {
      if (this.Config?.FileChanged) {
        let data: ITwoOptionDialogData = {
          title: this.translate.instant('dialog.unsaved.title'),
          textContent: this.translate.instant('dialog.unsaved.saveConfig'),
          resultTrueText: this.translate.instant('general.Yes'),
          hasResultFalse: true,
          resultFalseText: this.translate.instant('general.No'),
          resultTrueEnabled: () => { return true; },
          initalTrue: true
        };
        const dialogRef = this.dialog.open(TwoOptionsDialogComponent, { hasBackdrop: false, data: data });
        dialogRef.afterClosed().subscribe(res => {
          if (res) {
            if (this.UserMode == UserModes.LoggedIn) {
              this.OpenSaveConfigDialog('').then(() => {
                this.closeConfig();
                resolve();
              })
              .catch(() => reject());
            }
            else if (this.UserMode == UserModes.Guest) {
              this.ExportFile(false);
              this.closeConfig();
              resolve();
            }
          }
          else {
            this.closeConfig();
            resolve();
          }
        });
      }
      else {
        this.closeConfig();
        resolve();
      }
    });
  }

  private closeProject() {
    this.Project = null;
    this.selectedGHProject = null;
    this.locStorage.Remove(LocStorageKeys.GH_LAST_PROJECT);
    this.Config = ConfigFile.DefaultFile();
    this.Config.FileChanged = false;
    this.router.navigate(['/']);
  }

  private closeConfig() {
    this.Config = null;
    this.selectedGHConfig = null;
    this.Config = ConfigFile.DefaultFile();
    this.Config.FileChanged = false;
    this.router.navigate(['/']);
  }

  public OpenRepo(proj) {
    window.open(this.GetRepoOfFile(proj).url, '_blank');
  }

  public GetRepoOfFile(file): IGHRepository {
    return this.Repos.find(x => x.id == file.repoId);
  }

  public Debug() {
    console.log(this.Project);
    console.log(this.Config);

    let cwes = [];
    let capecs = [];
    this.Config.GetThreatOrigins().forEach(x => {
      if (x.OriginTypes.includes(ThreatOriginTypes.Weakness) && x.Weakness?.CWEID) cwes.push(x.Weakness.CWEID);
      if (x.OriginTypes.includes(ThreatOriginTypes.AttackTechnique) && x.AttackTechnique?.CAPECID) capecs.push(x.AttackTechnique.CAPECID);
    });

    cwes.sort((a,b) => a-b);
    capecs.sort((a,b) => a-b);

    let logs = ['Supported CWEs:', cwes, 'Supported CAPECs:', capecs, 'Threat Categories: ', this.Config.GetThreatCategories().length.toString()];
    logs.push(...['Threats: ', this.Config.GetThreatOrigins().length.toString(), 'Threat Rules: ', this.Config.GetThreatRules().length.toString()]), 'Threats Questions: ', this.Config.GetThreatQuestions().length.toString();
    console.log(logs);
  }

  public Debug2() {
    if (!this.Project) return;
    let proj = this.Project.ToJSON();
    delete proj.config;
    let res = JSON.stringify(proj, null, 2);
    const pending = this.clipboard.beginCopy(res);
    let remainingAttempts = 3;
    const attempt = () => {
      const result = pending.copy();
      if (!result && --remainingAttempts) {
        setTimeout(attempt);
      } else {
        // Remember to destroy when you're done!
        pending.destroy();
      }
    };
    attempt();
    return res;
  }

  public Debug3() {
    let res = JSON.stringify(this.Config.ToJSON(), null, 2);
    const pending = this.clipboard.beginCopy(res);
    let remainingAttempts = 3;
    const attempt = () => {
      const result = pending.copy();
      if (!result && --remainingAttempts) {
        setTimeout(attempt);
      } else {
        // Remember to destroy when you're done!
        pending.destroy();
      }
    };
    attempt();
    //console.log(JSON.stringify(this.Config.ToJSON(), null, 2));
    return res;
  }

  private retrieveUser() {
    if (!!this.accessToken && this.accessToken.length > 0) {
      this.isLoading.add();
      const octokit = new Octokit({ auth: this.accessToken });
      octokit.request('GET /user').then(({ data }) => {
        const onSuccess = () => {
          if (this.KeepUserSignedIn) {
            this.locStorage.Set(LocStorageKeys.GH_ACCOUNT_NAME, this.userAccount);
            this.locStorage.Set(LocStorageKeys.GH_USER_NAME, this.userName);
            this.locStorage.Set(LocStorageKeys.GH_USER_URL, this.userURL);
            this.locStorage.Set(LocStorageKeys.GH_USER_EMAIL, this.userEmail);
          }
          this.retrieveRepositories();
          this.router.navigate(['/home']);
        };

        this.userAccount = data.login;
        this.userName = data.name;
        this.userURL = data.html_url;
        this.userEmail = data.email;
        if (!this.UserEmail) {
          octokit.users.listEmailsForAuthenticatedUser().then(({ data }) => {
            this.userEmail = data.find(x => x.primary).email;
            onSuccess();
          }).catch(err => this.messagesService.Error('messages.error.githubfetch', err)).finally(() => this.isLoading.remove());
        }
        else {
          onSuccess();
        }
      }).catch((err) => {
        this.messagesService.Error('messages.error.githubfetch', err);
      })
      .finally(() => this.isLoading.remove());
    }
  }

  private blockLoading = false;
  private retrieveRepositories() {
    this.repos = [];
    this.availableGHProjects = [];

    const req = this.getExampleRepository();
    req.finally(() => {
      let getFiles = (octokit: Octokit) => {
        this.repos.forEach(rep => {
          this.isLoading.add();
          octokit.repos.getContent({
            owner: rep.owner,
            repo: rep.name,
            path: ''
          })
          .then(({ data: fileArray }) => {
            if ((fileArray as []).some(x => x['name'] == 'projects' && x['type'] == 'dir')) {
              this.isLoading.add();
              octokit.repos.getContent({
                owner: rep.owner,
                repo: rep.name,
                path: 'projects'
              })
              .then(({ data: fileArray }) => {
                (fileArray as []).filter(x => (x['name'] as string).endsWith('.ttmp')).forEach(x => {
                  this.availableGHProjects.push({ repoId: rep.id, name: x['name'], path: x['path'], sha: x['sha'], isEncrypted: false });
                  this.availableGHProjects = this.availableGHProjects.sort((a, b) => {
                    return this.GetRepoOfFile(a).isWritable ? -1 : (this.GetRepoOfFile(b).isWritable ? 1 : 0);
                  });
                  let lastProject = this.locStorage.Get(LocStorageKeys.GH_LAST_PROJECT);
                  if (!this.blockLoading && this.KeepUserSignedIn && lastProject) {
                    let parsed = JSON.parse(lastProject);
                    let proj = this.AvailableGHProjects.find(x => rep.owner == parsed['owner'] && x.repoId == parsed['repoId'] && x.path == parsed['path']);
                    if (proj) {
                      this.blockLoading = true;
                      this.LoadProject(proj);
                      setTimeout(() => {
                        this.blockLoading = false;
                      }, 5000);
                    }
                  }
                });
              }).finally(() => {
                this.isLoading.remove();
              });
            }
            if ((fileArray as []).some(x => x['name'] == 'configs' && x['type'] == 'dir')) {
              this.isLoading.add();
              octokit.repos.getContent({
                owner: rep.owner,
                repo: rep.name,
                path: 'configs'
              })
              .then(({ data: fileArray }) => {
                (fileArray as []).filter(x => (x['name'] as string).endsWith('.ttmc')).forEach(x => {
                  this.availableGHConfigs.push({ repoId: rep.id, name: x['name'], path: x['path'], sha: x['sha'], isEncrypted: false });
                  this.availableGHConfigs = this.availableGHConfigs.sort((a, b) => {
                    return this.GetRepoOfFile(a).isWritable ? -1 : (this.GetRepoOfFile(b).isWritable ? 1 : 0);
                  });
                });
              }).finally(() => {
                this.isLoading.remove();
              });
            }
          }).finally(() => {
            this.isLoading.remove();
          });
        });
      };

      if (this.UserMode == UserModes.LoggedIn) {
        const octokit = new Octokit({ auth: this.accessToken });
        this.isLoading.add();
        octokit.repos.listForAuthenticatedUser().then(({ data: fileArray }) => {
          fileArray.forEach(x => {
            let item: IGHRepository = {
              id: x.id,
              name: x.name,
              owner: x.owner.login,
              url: x.html_url,
              updated: new Date(x.updated_at),
              private: x.private,
              isWritable: true
            };
            this.repos.push(item);
          });
          getFiles(octokit);
        }).finally(() => {
          this.isLoading.remove();
        });
      }
      else {
        getFiles(new Octokit());
      }
    });
  }

  private getExampleRepository() {
    this.isLoading.add();
    const octokit = new Octokit();
    const owner = 'SecSimon';
    const repoName = 'TTM-examples';
    const req = octokit.repos.get({ owner: owner, repo: repoName });
    req.then(data => {
      const repoId = data.data.id;
      let item: IGHRepository = {
        id: repoId,
        name: repoName,
        owner: owner,
        url: data.data.html_url,
        updated: new Date(data.data.updated_at),
        private: data.data.private,
        isWritable: false
      };
      this.repos.push(item);
    }).catch(err => {
      this.messagesService.Error(err.message);
    }).finally(() => {
      this.isLoading.remove();
    });
    return req;
  }

  private restoreUserAccount() {
    this.accessToken = this.locStorage.Get(LocStorageKeys.AUTH_ACCESS_TOKEN);
    if (!StringExtension.NullOrEmpty(this.accessToken)) {
      this.userMode = UserModes.LoggedIn;
    }
    this.userName = this.locStorage.Get(LocStorageKeys.GH_USER_NAME);
    this.userAccount = this.locStorage.Get(LocStorageKeys.GH_ACCOUNT_NAME);
    this.userURL = this.locStorage.Get(LocStorageKeys.GH_USER_URL);
    this.userEmail = this.locStorage.Get(LocStorageKeys.GH_USER_EMAIL);
    if (this.UserMode == UserModes.LoggedIn) {
      setTimeout(() => {
        this.messagesService.Success('messages.success.welcomeBack', this.UserDisplayName);
      }, 500);
    }
  }
  
  private startUnsavedChangesTimer() {
    if (this.unsavedChangesTimer == null) {
      this.unsavedChangesMinutes = 0;
      this.unsavedChangesTimer = setInterval(() => {
        this.unsavedChangesMinutes++;
        if (this.unsavedChangesMinutes % 5 == 0) {
          this.messagesService.Warning(StringExtension.Format(this.translate.instant('messages.warning.unsavedChanges'), this.unsavedChangesMinutes.toString()));
        }
      }, 60*1000);
    }
  }

  private stopUnsavedChangesTimer() {
    if (this.unsavedChangesTimer) {
      clearInterval(this.unsavedChangesTimer);
      this.unsavedChangesTimer = null;
    }
  }
}
