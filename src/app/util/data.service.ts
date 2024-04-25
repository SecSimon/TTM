import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventEmitter, Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Octokit } from '@octokit/rest';
import { LocalStorageService, LocStorageKeys } from './local-storage.service';
import { IsLoadingService } from '@service-work/is-loading';
import { MyCrypto } from './mycrypto';
import { Clipboard } from '@angular/cdk/clipboard';
import * as path from 'path';

import { PasswordDialogComponent } from '../shared/components/password-dialog/password-dialog.component'; 
import { FileUpdateService } from './file-update.service';
import { MessagesService } from './messages.service';
import { ConfigFile } from '../model/config-file';
import { ProjectFile } from '../model/project-file';
import { AttackVectorTypes } from '../model/threat-model';
import { SaveDialogComponent } from '../shared/components/save-dialog/save-dialog.component';
import { ITwoOptionDialogData, TwoOptionsDialogComponent } from '../shared/components/two-options-dialog/two-options-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { DiagramTypes } from '../model/diagram';

import { v4 as uuidv4 } from 'uuid';
import { saveAs as saveAsDialog } from 'file-saver';
import { StringExtension } from './string-extension';


import { APP_CONFIG } from '../../environments/environment';
import { MatDialog } from '@angular/material/dialog';

import versionFile from '../../assets/version.json';
import { ElectronService } from '../core/services';
import { TransferProjectDialogComponent } from '../home/Dialogs/transfer-project-dialog/transfer-project-dialog.component';

export enum FileTypes {
  Project = 1,
  Config = 2
}

export enum FileSources {
  Import = 1,
  FileSystem = 2,
  GitHub = 3
}

export interface IFile {
  type: FileTypes;
  source: FileSources;
  name: string;
  path: string;
  isEncrypted: boolean;  
  repoId?: number;
  sha?: string;
  importData?: any;
}

export interface IFileContent {
  content: string;
  encrypted?: string;
}

export interface IGHRepository {
  id: number;
  name: string;
  owner: string;
  url: string;
  updated: Date;
  private: boolean;
  isWritable: boolean;
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
  private _selectedFile: IFile;
  private hasSpellCheck: boolean = null;

  private userMode: UserModes = UserModes.None;
  private userName: string;
  private userAccount: string;
  private userURL: string;
  private userEmail: string;
  private accessToken: string;
  private repos: IGHRepository[] = [];
  private availableFiles: IFile[] = [];

  private get selectedFile(): IFile { return this._selectedFile; }
  private set selectedFile(val: IFile) {
    this._selectedFile = val;
    if (val) this.addFileToHistory(val);
  }

  private fileContentCrypto: MyCrypto;

  private unsavedChangesTimer: NodeJS.Timer;
  private unsavedChangesMinutes: number;

  private project: ProjectFile;
  private config: ConfigFile;

  constructor(private locStorage: LocalStorageService, private isLoading: IsLoadingService, private http: HttpClient, private router: Router, private clipboard: Clipboard,
    private dialog: MatDialog, private messagesService: MessagesService, private translate: TranslateService, private fileUpdate: FileUpdateService, private zone: NgZone, 
    public electron: ElectronService) {
    this.checkAppVersionUpdate();
    this.restoreUserAccount();
    if (this.UserMode == UserModes.None) {
      if (this.locStorage.Get(LocStorageKeys.AUTH_GUEST) == 'true') this.userMode = UserModes.Guest;
    }
    if (this.UserMode == UserModes.LoggedIn || this.UserMode == UserModes.Guest) {
      this.retrieveRepositories();
    }

    this.Config = ConfigFile.DefaultFile();

    setTimeout(() => {
      const octokit = new Octokit();
      octokit.repos.listReleases({ owner: 'SecSimon', repo: 'TTM' }).then(({data}) => {
        const newerVersion = data.find(x => this.isNewVersion(x.tag_name, versionFile.version));
        if (newerVersion) {
          this.messagesService.Info(StringExtension.Format(this.translate.instant('messages.info.newVersion'), newerVersion.tag_name));
          setTimeout(() => {
            this.NewVersionAvailable = newerVersion.tag_name;
          }, 1500);
        }
      });
    }, 12000);
    
    if (this.electron.isElectron && this.electron.ipcRenderer) {
      this.electron.ipcRenderer.on('oncode', (e, args) => {
        this.zone.run(() => this.LogIn(args));
      });
      this.electron.ipcRenderer.on('OnNew', () => {
        this.zone.run(() => this.OnNewProject());
      });
      this.electron.ipcRenderer.on('OnSave', () => {
        this.zone.run(() => this.OnSave());
      });
      this.electron.ipcRenderer.on('OnSaveAs', () => {
        this.zone.run(() => this.OnSave(true));
      });
      this.electron.ipcRenderer.on('OnLocalDownload', () => {
        this.zone.run(() => this.OnSave(null, true));
      });
      this.electron.ipcRenderer.on('OnCloseFile', () => {
        this.zone.run(() => this.OnCloseFile());
      });

      this.electron.ipcRenderer.on('OnOpenFile', (event, data, filePath: string) => {
        this.zone.run(() => {
          if (!this.IsLoggedIn) this.GuestLogin();
          this.OnCloseFile().then(() => {
            const content = JSON.parse(data);
            this.locStorage.Remove(LocStorageKeys.LAST_FILE);
            this.OnLoadFile({ source: FileSources.FileSystem, importData: content, path: filePath, name: this.GetFileName(filePath), isEncrypted: null, type: null})
          });
        });
      });

      this.electron.ipcRenderer.send('RendererReady');

      const lastFiles = this.getLastFileHistory().filter(x => x.source == FileSources.FileSystem);
      if (lastFiles.length > 0) this.electron.ipcRenderer.send('ExistFiles', lastFiles.map(x => x.path));

      this.electron.ipcRenderer.on('ExistFilesCallback', (event, files: string[]) => {
        this.zone.run(() => {
          files.forEach(x => this.addFileToAvailableFiles(lastFiles.find(y => y.path == x && y.source == FileSources.FileSystem)));

          const lastFile = this.locStorage.Get(LocStorageKeys.LAST_FILE);
          if (lastFile) {
            const parsed = JSON.parse(lastFile) as IFile;
            if (parsed.source == FileSources.FileSystem) {
              const f = this.AvailableFiles.find(x => x.source == FileSources.FileSystem && x.path == parsed.path);
              if (f) {
                if (!this.IsLoggedIn) this.GuestLogin();
                this.messagesService.Info(StringExtension.Format(this.translate.instant('messages.info.loadFile'), f.name));
                this.OnLoadFile(f);
              }
            }
          }
        });
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
  public get UserDisplayName(): string { return !StringExtension.NullOrEmpty(this.UserName) ? this.UserName : this.UserAccount }

  public get Repos(): IGHRepository[] { return this.repos; }
  public get SelectedFile(): IFile { return this.selectedFile; }
  public get SelectedGHFile(): IFile { return this.selectedFile?.source == FileSources.GitHub ? this.SelectedFile : null; }
  public get SelectedFSFile(): IFile { return this.selectedFile?.source == FileSources.GitHub ? this.SelectedFile : null; }
  public get AvailableFiles(): IFile[] { return this.availableFiles; }
  public get AvailableProjects(): IFile[] { return this.availableFiles.filter(x => x.type == FileTypes.Project); }
  public get AvailableConfigs(): IFile[] { return this.availableFiles.filter(x => x.type == FileTypes.Config); }
  public get AvailableFSProjects(): IFile[] { return this.availableFiles.filter(x => x.source == FileSources.FileSystem && x.type == FileTypes.Project); }
  public get AvailableFSConfigs(): IFile[] { return this.availableFiles.filter(x => x.source == FileSources.FileSystem && x.type == FileTypes.Config); }
  public get AvailableGHProjects(): IFile[] { return this.availableFiles.filter(x => x.source == FileSources.GitHub && x.type == FileTypes.Project); }
  public get AvailableGHConfigs(): IFile[] { return this.availableFiles.filter(x => x.source == FileSources.GitHub && x.type == FileTypes.Config); }

  public get HasProject(): boolean { return this.Project != null; }
  public get Project(): ProjectFile {
    return this.project;
  }
  public set Project(val: ProjectFile) {
    if (this.project != val) {
      if (val && val.TTModelerVersion && this.isNewVersion(val.TTModelerVersion, versionFile.version)) {
        this.messagesService.Error(StringExtension.Format(this.translate.instant('messages.error.newerFileVersion'), val.TTModelerVersion));
        val = null;
      }
      this.project = val;
      if (val) {
        this.project.FileChanged = false;
        val.TTModelerVersion = versionFile.version;
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

  public get CanSaveFile(): boolean {
    if (this.SelectedFile?.source == FileSources.GitHub) return this.GetRepoOfFile(this.SelectedFile).isWritable;
    return true;
  }

  public get CanSaveProject(): boolean {
    return this.CanSaveFile && this.Project != null;
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

  public NewVersionAvailable: string = null;

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
    this.locStorage.Set(LocStorageKeys.AUTH_GUEST, String(true));
    this.retrieveRepositories();
    this.router.navigate(['/']);
  }

  public LogOut() {
    this.OnCloseFile().then(() => {
      this.clearLoginData();
      this.AvailableFiles.forEach(file => {
        if (file.source == FileSources.GitHub && this.GetRepoOfFile(file).owner != 'SecSimon') this.removeFileFromAvailableFiles(file);
      });
      this.messagesService.Info('messages.info.logout');
      this.router.navigate(['/']);
    });
  }

  public OnNewProject(config: IFile = null) {
    this.isLoading.add();
    this.OnCloseFile().then(() => {
      this.selectedFile = null;

      const createProject = (cfg: ConfigFile) => {
        cfg.Data['ID'] = uuidv4();
        const proj = new ProjectFile({}, cfg);
        proj.InitializeNewProject();
        proj.CreateDiagram(DiagramTypes.DataFlow);
  
        proj.Name = 'Project.ttmp';
        this.selectedFile = { source: FileSources.Import, type: FileTypes.Project, name: proj.Name, isEncrypted: null, path: null}
        this.Project = proj;
        this.locStorage.Remove(LocStorageKeys.LAST_FILE);
  
        // DEBUG CHECK if serialization is working
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
        
        this.isLoading.remove();
      };

      if (config) {
        this.GetFile(config).then(file => createProject(file as ConfigFile)).catch(err => this.messagesService.Error(err));
      }
      else {
        createProject(ConfigFile.DefaultFile());
      }
    });
  }

  public OnLoadFile(file: IFile) {
    const lastFile = this.locStorage.Get(LocStorageKeys.LAST_FILE);
    this.OnCloseFile().then(() => {
      if (file.source == FileSources.GitHub) {
        // check for outdated file
        if (lastFile) {
          const parsedLastFile = JSON.parse(lastFile);
          if (this.compareFiles(file, parsedLastFile)) {
            // same as last project
            if (file.sha != parsedLastFile['sha']) {
              this.isLoading.remove();
              this.messagesService.Error('messages.error.githuboutdatedfile');
              return;
            }
          }
        }
      }

      this.selectedFile = file;

      this.GetFile(file).then((f) => {
        if (f instanceof ProjectFile) {
          this.Project = f;
          this.messagesService.Success('messages.success.loadProject', file.name);
        }
        else if (f) {
          this.Config = f;
          this.Project = null
          this.messagesService.Success('messages.success.loadConfig', file.name);
        }
      }).catch(err => {
        this.messagesService.Error(err);
      });
    });
  }

  public ImportFile(fileInput: any) {
    if (fileInput.target.files && fileInput.target.files[0]) {
      const reader = new FileReader();
      const filePath: string = this.electron.isElectron ? fileInput.target.files[0].path : fileInput.target.files[0].name;
      reader.onload = (e) => {
        const fileRes = reader.result;
        const file = JSON.parse(fileRes.toString());
        this.OnLoadFile({ path: filePath, name: this.GetFileName(filePath), source: FileSources.Import, type: null, isEncrypted: null, importData: file });
      };

      reader.readAsText(fileInput.target.files[0]);
    }
  }

  public GetFile(file: IFile): Promise<ProjectFile|ConfigFile> {
    return new Promise<ProjectFile|ConfigFile>((resolve, reject) => {
      this.isLoading.add();

      const parseFile = (fileBlob: any, file: IFile) => {
        const parseF = (blob, path: IFile) => {
          if ('content' in blob) {
            const content = blob['content'];
            const json = JSON.parse(content);
            file.type = json['config'] != null ? FileTypes.Project : FileTypes.Config;

            if (file.type == FileTypes.Project) {
              const updated = this.fileUpdate.UpdateProjectFile(json);
              json['Data']['Name'] = file.name;
              resolve(ProjectFile.FromJSON(json));
            }
            else {
              const updated = this.fileUpdate.UpdateConfigFile(json);
              json['Data']['Name'] = file.name;
              resolve(ConfigFile.FromJSON(json));
            }
          }
          else {
            reject('Unsupported file');
          }
        };
    
        if ('encrypted' in fileBlob) {
          const decrypt = (blob: any, path: IFile) => {
            const data = { 'pw': '', 'file': file.name };
            this.isLoading.add();
            const dialogRef = this.dialog.open(PasswordDialogComponent, { hasBackdrop: false, data: data });
            dialogRef.afterClosed().subscribe((res) => {
              if (res) {
                try {
                  this.fileContentCrypto = new MyCrypto(data.pw);
                  const keycheck = this.fileContentCrypto.Decrypt(blob.encrypted);
                  blob.content = JSON.parse(this.fileContentCrypto.Decrypt(blob.content));
                  delete blob['encrypted'];
                  parseF(blob, path);
                } 
                catch (error) {
                  this.messagesService.Warning('messages.warning.wrongPassword');
                  decrypt(blob, path);
                }
                finally {
                  this.isLoading.remove();
                }
              }
              else {
                this.isLoading.remove();
              }
            });
          };
    
          file.isEncrypted = true;
          decrypt(fileBlob, file);
        }
        else {
          parseF(fileBlob, file);
        }
      };

      if (file.importData) {
        const data = file.importData;
        file.importData = null;
        parseFile(data, file);
        this.isLoading.remove();
      }
      else if (file.source == FileSources.GitHub) {
        const octokit = this.UserMode == UserModes.LoggedIn ? new Octokit({ auth: this.accessToken }) : new Octokit();
        octokit.git.getBlob({ owner: this.GetRepoOfFile(file).owner, repo: this.GetRepoOfFile(file).name, file_sha: file.sha }).then(({ data }) => {
          const fileContent = JSON.parse(Buffer.from(data['content'], 'base64').toString()) as IFileContent;
          parseFile(fileContent, file);
        }).catch((err) => {
          this.messagesService.Error('messages.error.githubfetch', err);
        }).finally(() => {
          this.isLoading.remove();
        });
      }
      else if (file.source == FileSources.FileSystem) {
        if (this.electron.ipcRenderer.listenerCount('ReadFileCallback') == 0) {
          this.electron.ipcRenderer.on('ReadFileCallback', (event, data, filePath: string) => {
            this.zone.run(() => {
              try {
                const fileContent = JSON.parse(data);
                parseFile(fileContent, file);
              } catch (error) {
                console.log(error);
              } finally {
                this.isLoading.remove();
              }
            });
            
            this.electron.ipcRenderer.removeAllListeners('ReadFileCallback');
          });
        }
        this.electron.ipcRenderer.send('ReadFile', file.path);
      }
    });
  }

  public ReloadFile() {
    if (this.SelectedFile) {
      const curr = this.SelectedFile;
      this.OnCloseFile().then(() => {
        this.OnLoadFile(curr);
      });
    }
  }

  public RestoreCommit(commit: IGHCommitInfo) {
    const octokit = this.UserMode == UserModes.LoggedIn ? new Octokit({ auth: this.accessToken }) : new Octokit();
    const proj = this.SelectedFile;
    
    octokit.repos.getCommit({ owner: this.GetRepoOfFile(proj).owner, repo: this.GetRepoOfFile(proj).name, ref: commit.sha }).then(({ data }) => {
      if (data.files?.length == 1 && data.files[0].filename == this.SelectedFile.path) {
        const oldFile = JSON.parse(JSON.stringify(this.SelectedFile)) as IFile;
        oldFile.sha = data.files[0].sha;
        this.OnLoadFile(oldFile);
      }
    });
  }

  public OnSave(saveAs: boolean = false, exportFile: boolean = false, exportConfig: boolean = false): Promise<void> {
    //console.log('OnSave', saveAs, exportFile, exportConfig, this.SelectedFile);
    return new Promise<void>((resolve, reject) => {
      this.ConsistencyCheck().then(x => {
        //console.log('consistency checked');
        const startDownload = (name: string, content: string) => {
          const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
          const now = new Date();
          const names = name.split('.');
          const date = [now.getFullYear(), now.getMonth()+1, now.getDate()];
          const time = [now.getHours(), now.getMinutes(), now.getSeconds()];
          const leading0 = (num: number, length: number = 2): string => {
            let val = num.toString();
            while(val.length < length) val = '0' + val;
            return val;
          };
          names.splice(1, 0, ...['_', ...date.map(x => leading0(x)), '_', ...time.map(x => leading0(x)), '.']);
          //console.log('saveAsDialog');
          saveAsDialog(blob, names.join(''));
          resolve();
        };

        const startUpload = (callback, owner: string, repo: string, path: string, msg: string, sha: string, json, enc: boolean, pw: string = null) => {
          this.isLoading.add();
          const content = this.getFileContent(json, enc, pw);
          const octokit = new Octokit({ auth: this.accessToken });
          //console.log('githubUpload');
          return octokit.rest.repos.createOrUpdateFileContents({
            owner: owner,
            repo: repo,
            path: path,
            message: msg.length == 0 ? 'Update' : msg,
            content: Buffer.from(content).toString('base64'),
            sha: sha,
            committer: {
              name: this.UserAccount,
              email: this.UserEmail
            }
          })
          .then(({ data: res }) => {
            callback(res);
          }).catch((err) => {
            if (err.status == 409 && err.message.includes('does not match')) {
              this.messagesService.Error('messages.error.githubSHAmismatch');
            }
            else {
              this.messagesService.Error('messages.error.githubpush', err);
            }
          }).finally(() => this.isLoading.remove());
        };

        const isEncrypted = (this.SelectedFile?.isEncrypted) ? true : false;
        if (exportConfig && exportFile) {
          //console.log('Path1');
          // download config file
          this.isLoading.add();
          let name = this.Config.Name;
          if (this.Project) name = this.Project.Name.replace('.ttmp', '.ttmc');
          if (!name.endsWith('.ttmc')) name = name + '.ttmc';
          startDownload(name, this.getFileContent(this.Config.ToJSON(), isEncrypted));
          this.isLoading.remove();
        }
        else {
          //console.log('Path2');
          const srcFile: ProjectFile|ConfigFile = (this.SelectedFile?.type == FileTypes.Project && !exportConfig) ? this.Project : this.Config;
          let name = '';
          if (exportConfig) name = this.SelectedFile.name.replace('.ttmp', '.ttmc');
          else if (this.SelectedFile) name = this.SelectedFile.name;
          else if (this.Project) name = this.Project.Name + (this.Project.Name.endsWith('.ttmp') ? '' : '.ttmp');
          else if (this.Config) name = this.Config.Name + (this.Config.Name.endsWith('.ttmc') ? '' : '.ttmc');
          srcFile.Name = name;
          if (!this.SelectedFile) exportFile = true;
          else if (this.SelectedFile.source == FileSources.GitHub && !this.GetRepoOfFile(this.SelectedFile).isWritable) {
            if (this.IsLoggedIn) saveAs = true;
            else exportFile = true;
          }
          else if (this.SelectedFile.source == FileSources.Import && !this.IsLoggedIn) exportFile = true;
          else if (saveAs && this.SelectedFile.type == FileTypes.Config && this.IsLoggedIn) exportConfig = true; 

          if (exportConfig) {
            // export config to repo
            if (this.UserMode == UserModes.LoggedIn) {
              //console.log('Path3');
              const data = { 'msg': '' };
              data['newConfig'] = { source: FileSources.GitHub, type:FileTypes.Config, name: '', path: '', repoId: null, isEncrypted: isEncrypted, sha: null } as IFile;
              if (isEncrypted) { data['removePW'] = false; }
              const dialogRef = this.dialog.open(SaveDialogComponent, { hasBackdrop: false, data: data });
              dialogRef.afterClosed().subscribe(res => {
                if (res) {
                  if (data['newConfig'] != null) {
                    const cfgFile = data['newConfig'] as IFile;
                    this.selectedFile = cfgFile;
                    if (!this.Project) this.Config.Name = cfgFile.name;
                    const callback = (res) => {
                      cfgFile.sha = res.content.sha;
                      this.addFileToAvailableFiles(cfgFile);
                      this.messagesService.Success('messages.success.saveConfig', cfgFile.name);
                      resolve();
                    };
                    startUpload(
                      callback,
                      this.GetRepoOfFile(cfgFile).owner,
                      this.GetRepoOfFile(cfgFile).name,
                      cfgFile.path,
                      data.msg,
                      cfgFile.sha,
                      this.Config.ToJSON(),
                      (data['pw'] != null || isEncrypted) && !data['removePW'],
                      data['pw']
                    );
                  }
                  else {
                    console.log('Should this happen?')
                  }
                }
                else resolve();
              });
            }
            else {
              console.error('not logged in');
            }
          }
          else if (exportFile) {
            //console.log('Path4');
            this.isLoading.add();
            const content = this.getFileContent(srcFile.ToJSON(), isEncrypted);
            startDownload(name, content);
            this.isLoading.remove();
          }
          else {
            //console.log('Path5');
            const onSuccess = (f: IFile) => {
              this.addFileToAvailableFiles(f);
              if (this.SelectedFile.type == FileTypes.Project) {
                this.messagesService.Success('messages.success.saveProject', this.Project.Name);
                this.ProjectSaved.emit(this.Project);
              }
              else {
                this.messagesService.Success('messages.success.saveConfig', this.Config.Name);
                this.ConfigChanged.emit(this.Config);
              }
              setTimeout(() => {
                if (this.Project) this.Project.FileChanged = false;
                if (this.Config) this.Config.FileChanged = false;
              }, 500);
              this.stopUnsavedChangesTimer();
              resolve();
            };
  
            if ([FileSources.GitHub, FileSources.Import].includes(this.SelectedFile.source) || (this.UserMode == UserModes.LoggedIn && saveAs)) {
              //console.log('Path6');
              const data = { 'msg': '' };
              if (this.SelectedFile.source == FileSources.Import || saveAs) {
                data['newProject'] = { name: '', source: FileSources.GitHub, type: this.SelectedFile.type, configFile: null, path: '', repoId: this.SelectedFile.repoId, isEncrypted: isEncrypted, sha: null } as IFile;
              }
              if (isEncrypted) { data['removePW'] = false; }
  
              const dialogRef = this.dialog.open(SaveDialogComponent, { hasBackdrop: false, data: data });
              dialogRef.afterClosed().subscribe(res => {
                if (res) {
                  if (data['newProject'] != null) {
                    this.selectedFile = data['newProject'];
                    this.Project.Name = this.selectedFile.name;
                  }
                  
                  const callback = (res) => {
                    this.selectedFile.sha = res.content.sha;
                    const lastFile = this.locStorage.Get(LocStorageKeys.LAST_FILE);
                    const parsed = JSON.parse(lastFile) as IFile;
                    if (this.compareFiles(this.SelectedFile, parsed)) {
                      this.locStorage.Set(LocStorageKeys.LAST_FILE, JSON.stringify(this.SelectedFile));
                    }

                    onSuccess(this.SelectedFile);
                  };
                  startUpload(
                    callback,
                    this.GetRepoOfFile(this.SelectedFile).owner,
                    this.GetRepoOfFile(this.SelectedFile).name,
                    this.SelectedFile.path,
                    data.msg,
                    this.SelectedFile.sha,
                    srcFile.ToJSON(),
                    (data['pw'] != null || isEncrypted) && !data['removePW'],
                    data['pw']
                  );
                }
                else resolve();
              });
            }
            else if (this.SelectedFile.source == FileSources.FileSystem) {
              //console.log('Path7');
              if (this.electron.ipcRenderer.listenerCount('SaveFileCallback') == 0) {
                this.electron.ipcRenderer.on('SaveFileCallback', (event, path) => {
                  this.zone.run(() => {
                    if (path) {
                      if (saveAs) {
                        this.selectedFile = { source: FileSources.FileSystem, type: this.SelectedFile.type, path: path, name: this.GetFileName(path), isEncrypted: this.SelectedFile.isEncrypted };
                        this.Project.Name = this.GetFileName(path);
                      }
                      onSuccess(this.SelectedFile);
                    }
                    else reject();
                  });
                  
                  this.electron.ipcRenderer.removeAllListeners('SaveFileCallback');
                  this.isLoading.remove();
                });
              }
              this.isLoading.add();
              const content = this.getFileContent(srcFile.ToJSON(), isEncrypted);
              this.electron.ipcRenderer.send(saveAs ? 'SaveFileAs' : 'SaveFile', this.SelectedFile.path, content);
            }
          }
        }
      });
    });
  }

  public OnCloseApp(event) {
    if (this.Project?.FileChanged || this.Config?.FileChanged) {
      this.zone.run(() => {
        this.OnCloseFile().then(() => {
          if (this.electron.isElectron) this.electron.ipcRenderer.send('OnCloseApp');
        });
      });
      event.returnValue = false;
      return false;
    }
  }

  public DeleteFile(file: IFile) {
    this.isLoading.add();
    if (file.source == FileSources.GitHub) {
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
        if (file == this.SelectedFile) {
          this.selectedFile = null;
          this.Project = null;
          this.Config = ConfigFile.DefaultFile();
        }

        this.removeFileFromAvailableFiles(file);
      }).catch((err) => {
        this.messagesService.Error('messages.error.githubdelete', err);
        console.error(err);
      }).finally(() => this.isLoading.remove());
    }
    else if (file.source == FileSources.FileSystem) {
      const data: ITwoOptionDialogData = {
        title: this.translate.instant('dialog.delete.deleteItem') + ' ' + name,
        textContent: this.translate.instant('dialog.delete.sure'),
        resultTrueText: this.translate.instant('general.Yes'),
        hasResultFalse: true,
        resultFalseText: this.translate.instant('general.No'),
        resultTrueEnabled: () => { return true; },
        initalTrue: false
      };
      const dialogRef = this.dialog.open(TwoOptionsDialogComponent, { hasBackdrop: true, data: data });
      dialogRef.afterClosed().subscribe(res => {
        if (res) {
          this.removeFileFromAvailableFiles(file);
          if (this.electron.isElectron) this.electron.ipcRenderer.send('DeleteFile', file.path);
        }
        this.isLoading.remove();
      });
    }
  }

  public RemoveFSFile(file: IFile) {
    this.removeFileFromAvailableFiles(file);
  }

  public ExchangeConfig(conf: IFile) {
    this.exchangeConfigDialog().subscribe(res => {
      if (res) {
        const octokit = new Octokit({ auth: this.accessToken });
        octokit.repos.getContent(
        {
          owner: this.GetRepoOfFile(conf).owner,
          repo: this.GetRepoOfFile(conf).name,
          path: conf.path
        }).then(({ data }) => {
          let confContent = JSON.parse(Buffer.from(data['content'], 'base64').toString()) as IFileContent;

          let configJSON = JSON.parse(confContent.content);
          this.fileUpdate.UpdateConfigFile(configJSON);
          let proj = this.Project.ToJSON();
          proj.config = configJSON;
          this.Project = ProjectFile.FromJSON(proj);

          this.messagesService.Info('messages.info.exchangeConfig');
        }).catch((err) => {
          this.closeFile();
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

  public OnTransferProjectDetails() {
    this.dialog.open(TransferProjectDialogComponent);
  }

  public GetGHProjectHistory() {
    return new Promise<IGHCommitInfo[]>((resolve, reject) => {
      let res: IGHCommitInfo[] = [];
      if (this.SelectedFile) {
        const octokit = this.UserMode == UserModes.LoggedIn ? new Octokit({ auth: this.accessToken }) : new Octokit();
        const proj = this.SelectedFile;
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

  public OnCloseFile(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.Project?.FileChanged || this.Config?.FileChanged) {
        let data: ITwoOptionDialogData = {
          title: this.translate.instant('dialog.unsaved.title'),
          textContent: this.translate.instant(this.Project?.FileChanged ? 'dialog.unsaved.saveProject' : 'dialog.unsaved.saveConfig'),
          resultTrueText: this.translate.instant('general.Yes'),
          hasResultFalse: true,
          resultFalseText: this.translate.instant('general.No'),
          resultTrueEnabled: () => { return true; },
          initalTrue: true
        };
        const dialogRef = this.dialog.open(TwoOptionsDialogComponent, { hasBackdrop: false, data: data });
        dialogRef.afterClosed().subscribe(res => {
          if (res) {
            this.OnSave().then(() => {
              this.closeFile();
              resolve();
            }).catch(() => reject());
          }
          else {
            this.closeFile();
            resolve();
          }
        });
      }
      else {
        this.closeFile();
        resolve();
      }
    });
  }

  public ConsistencyCheck() {
    return new Promise<boolean>((resolve) => {
      if (this.Project) {
        const errors = this.Project.ConsistencyCheck(this.translate);
        if (errors.length > 0) {
          let msg = this.translate.instant('dialog.consistencycheck.desc') + ':\n\n';
          msg += errors.join('\n');
          let data: ITwoOptionDialogData = {
            title: this.translate.instant('dialog.consistencycheck.title'),
            textContent: msg,
            resultTrueText: this.translate.instant('general.OK'),
            hasResultFalse: false,
            resultFalseText: '',
            resultTrueEnabled: () => { return true; },
            initalTrue: false
          };
          
          const ref = this.dialog.open(TwoOptionsDialogComponent, { hasBackdrop: false, data: data });
          ref.afterClosed().subscribe(x => resolve(false));
        }
        else {
          resolve(true);
        }
      }
      else {
        resolve(true);
      }
    });
  }

  public ManualConsistencyCheck() {
    this.ConsistencyCheck().then(res => {
      if (res) this.messagesService.Success('messages.success.ConsistencyCheck')
    });
  }

  public SetPassword(pw: string) {
    if (this.SelectedFile) {
      this.SelectedFile.isEncrypted = true;
      this.fileContentCrypto = new MyCrypto(pw);
    }
  }

  public RemovePassword() {
    if (this.SelectedFile) {
      this.SelectedFile.isEncrypted = false;
    }
  }

  public OpenRepo(proj) {
    window.open(this.GetRepoOfFile(proj).url, '_blank');
  }

  public GetRepoOfFile(file: IFile): IGHRepository {
    return this.Repos.find(x => x.id == file.repoId);
  }

  public GetFileName(p: string) {
    return p.substring(p.lastIndexOf(path.sep)+1);
  }

  public GetFilePath(p: string) {
    return p.substring(0, p.lastIndexOf(path.sep));
  }

  public Debug() {
    console.log(this.Project);
    console.log(this.Config);

    let cwes = [];
    let capecs = [];
    this.Config.GetAttackVectors().forEach(x => {
      if (x.OriginTypes.includes(AttackVectorTypes.Weakness) && x.Weakness?.CWEID) cwes.push(x.Weakness.CWEID);
      if (x.OriginTypes.includes(AttackVectorTypes.AttackTechnique) && x.AttackTechnique?.CAPECID) capecs.push(x.AttackTechnique.CAPECID);
    });

    cwes.sort((a,b) => a-b);
    capecs.sort((a,b) => a-b);

    let logs = ['Supported CWEs:', cwes, 'Supported CAPECs:', capecs, 'Threat Categories: ', this.Config.GetThreatCategories().length.toString()];
    logs.push(...['Threats: ', this.Config.GetAttackVectors().length.toString(), 'Threat Rules: ', this.Config.GetThreatRules().length.toString()]), 'Threats Questions: ', this.Config.GetThreatQuestions().length.toString();
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

  private checkAppVersionUpdate() {
    const lastVersion = this.locStorage.Get(LocStorageKeys.CURRENT_VERSION);
    if (lastVersion && versionFile.version != lastVersion) {
      // if new version is higher than 0.4.18 but last version was below 0.4.19
      if (this.isNewVersion(versionFile.version, '0.4.18') && !this.isNewVersion(lastVersion, '0.4.18')) {
        this.locStorage.Remove(LocStorageKeys.LAST_FILE);
        //this.locStorage.Remove(LocStorageKeys.PROJECT_HISTORY);
        const historyStr = this.locStorage.Get(LocStorageKeys.FILE_HISTORY);
        if (historyStr) {
          const history = JSON.parse(historyStr) as string[]; 
          const newHistory: IFile[] = [];
          history.forEach(item => {
            const parts = item.split(':');
            const src = parts[0] == 'FS' ? FileSources.FileSystem : FileSources.GitHub;
            const newEntry: IFile = { path: parts[1], name: this.GetFileName(parts[1]), source: src, type: FileTypes.Project, isEncrypted: null };
            if (src == FileSources.GitHub) newEntry.repoId = Number(parts[0]);
            newHistory.push(newEntry);
          });
          this.locStorage.Set(LocStorageKeys.FILE_HISTORY, JSON.stringify(newHistory));
        }
      }

      setTimeout(() => {
        this.messagesService.Info(StringExtension.Format(this.translate.instant('messages.info.versionUpdate'), versionFile.version));
      }, 5000);
    }
    this.locStorage.Set(LocStorageKeys.CURRENT_VERSION, versionFile.version);
  }

  private getFileContent(json, encrypt: boolean, password: string = null): string {
    this.isLoading.add();
    if (this.SelectedFile) this.SelectedFile.isEncrypted = encrypt;

    const file: IFileContent = {
      content: JSON.stringify(json)
    };
    if (encrypt) {
      if (password) this.fileContentCrypto = new MyCrypto(password);
      let tmpFile: IFileContent = JSON.parse(JSON.stringify(file));
      file.content = this.fileContentCrypto.Encrypt(JSON.stringify(tmpFile.content));
      file.encrypted = this.fileContentCrypto.Encrypt(this.fileContentCrypto.GetRandom(16).toString('base64'));
    }

    const res = JSON.stringify(file);
    this.isLoading.remove();
    return res;
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

  private closeFile() {
    this.Project = null;
    this.Config = null;
    this.selectedFile = null;
    this.locStorage.Remove(LocStorageKeys.LAST_FILE);
    this.Config = ConfigFile.DefaultFile();
    this.Config.FileChanged = false;
    this.router.navigate(['/']);
  }

  private addFileToAvailableFiles(file: IFile) {
    if (file) {
      if (!this.AvailableFiles.some(x => this.compareFiles(x, file))) {
        this.availableFiles.splice(0, 0, file);
      }
      const history = this.getLastFileHistory();
      this.availableFiles = this.availableFiles.sort((a, b) => {
        // put not writable repos to end
        if (a.source == FileSources.GitHub && !this.GetRepoOfFile(a)?.isWritable) return 1;
        if (b.source == FileSources.GitHub && !this.GetRepoOfFile(b)?.isWritable) return -1;
        
        // sort according to history
        let aIdx = history.findIndex(x => this.compareFiles(x, a));
        let bIdx = history.findIndex(x => this.compareFiles(x, b));
        if (aIdx >= 0 || bIdx >= 0) {
          if (aIdx == -1) aIdx = Number.MAX_VALUE;
          if (bIdx == -1) bIdx = Number.MAX_VALUE;
          return aIdx < bIdx ? -1 : 1;
        }
      });
    }
  }

  private removeFileFromAvailableFiles(file: IFile) {
    this.removeFileFromHistory(file);
    const index = this.AvailableFiles.findIndex(x => this.compareFiles(x, file));
    if (index >= 0) {
      this.availableFiles.splice(index, 1);
    }
  }

  private addFileToHistory(file: IFile) {
    if (file && (this.KeepUserSignedIn || file.source == FileSources.FileSystem)) {
      const history = this.getLastFileHistory();
      const index = history.findIndex(x => this.compareFiles(x, file));
      if (index >= 0) history.splice(index, 1);
      const fileCopy = JSON.parse(JSON.stringify(file));
      delete fileCopy.importData;
      history.splice(0, 0, fileCopy);
      this.locStorage.Set(LocStorageKeys.FILE_HISTORY, JSON.stringify(history));
      this.locStorage.Set(LocStorageKeys.LAST_FILE, JSON.stringify(fileCopy));

      this.addFileToAvailableFiles(file);
    }
  }

  private removeFileFromHistory(file: IFile) {
    if (file && file.path) {
      const history = this.getLastFileHistory();
      const index = history.findIndex(x => this.compareFiles(x, file));
      if (index >= 0) history.splice(index, 1);
      this.locStorage.Set(LocStorageKeys.FILE_HISTORY, JSON.stringify(history));

      const lastFile = JSON.parse(this.locStorage.Get(LocStorageKeys.LAST_FILE)) as IFile;
      if (lastFile && this.SelectedFile && lastFile.source == FileSources.GitHub && this.compareFiles(lastFile, this.SelectedFile)) {
        this.locStorage.Remove(LocStorageKeys.LAST_FILE);
      }
    }
  }

  private getLastFileHistory(): IFile[] {
    const historyStr = this.locStorage.Get(LocStorageKeys.FILE_HISTORY);
    if (historyStr) return JSON.parse(historyStr); 
    else return [];
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

    const addNewFile = (type: FileTypes, repoId: number, name: string, path: string, sha: string) => {
      const newFile = { repoId: repoId, name: name, path: path, sha: sha, isEncrypted: false, source: FileSources.GitHub, type: type };
      this.addFileToAvailableFiles(newFile);

      const lastFile = this.locStorage.Get(LocStorageKeys.LAST_FILE);
      if (!this.blockLoading && this.KeepUserSignedIn && lastFile) {
        const parsed = JSON.parse(lastFile);
        const file = this.AvailableFiles.find(x => x.source == FileSources.GitHub && this.compareFiles(x, parsed));
        if (file) {
          this.blockLoading = true;
          this.messagesService.Info(StringExtension.Format(this.translate.instant('messages.info.loadFile'), file.name));
          this.OnLoadFile(file);
          setTimeout(() => {
            this.blockLoading = false;
          }, 5000);
        }
      }
    };

    const req = this.getExampleRepository();
    req.finally(() => {
      const getFiles = (octokit: Octokit) => {
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
                  addNewFile(FileTypes.Project, rep.id, x['name'], x['path'], x['sha']);
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
                  addNewFile(FileTypes.Config, rep.id, x['name'], x['path'], x['sha']);
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
        this.messagesService.Success('messages.success.welcomeBack', StringExtension.EmptyIfNull(this.UserDisplayName));
      }, 500);
    }
  }

  private compareFiles(f1: IFile, f2: IFile): boolean {
    return f1.source == f2.source && f1.name == f2.name && f1.path == f2.path && f1.repoId == f2.repoId;
  }

  private isNewVersion(tag: string, current: string): boolean {
    const currArr = current.replace('v', '').split('.');
    const tagArr = tag.replace('v', '').split('.');

    if (currArr.length == tagArr.length) {
      for (let i = 0; i < currArr.length; i++) {
        if (Number(tagArr[i]) > Number(currArr[i])) return true;
        else if (Number(tagArr[i]) < Number(currArr[i])) break;
      }
    }

    return false;
  };
  
  private startUnsavedChangesTimer() {
    if (this.unsavedChangesTimer == null) {
      this.unsavedChangesMinutes = 0;
      this.unsavedChangesTimer = setInterval(() => {
        this.unsavedChangesMinutes++;
        if (this.unsavedChangesMinutes % 5 == 0 && this.messagesService.ShowUnsavedChanges) {
          this.messagesService.UnsavedChanges(StringExtension.Format(this.translate.instant('messages.warning.unsavedChanges'), this.unsavedChangesMinutes.toString()));
          this.ConsistencyCheck();
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
