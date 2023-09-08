import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AssetGroup, MyData } from '../../../model/assets';
import { IKeyValue } from '../../../model/database';
import { ProjectFile } from '../../../model/project-file';
import { DataService } from '../../../util/data.service';
import { MessagesService } from '../../../util/messages.service';

export interface IFileDetails {
  key: any;
  name: string;
  tooltip: string;
}

@Component({
  selector: 'app-transfer-project-dialog',
  templateUrl: './transfer-project-dialog.component.html',
  styleUrls: ['./transfer-project-dialog.component.scss']
})
export class TransferProjectDialogComponent implements OnInit {
  private sourceProject: ProjectFile;

  constructor(public dataService: DataService, private messageService: MessagesService, private translate: TranslateService) { }

  public AvailableProjects: IFileDetails[] = [];
  public SelectedProject: IFileDetails;

  public get SourceProject(): ProjectFile { return this.sourceProject; }
  public set SourceProject(val: ProjectFile) {
    this.sourceProject = val;
    this.TransferLog = null;
  }

  public Details: IKeyValue[] = [];
  public AllDetails: boolean = false;
  public TransferLog: string = null;

  ngOnInit(): void {
    this.dataService.AvailableGHProjects.filter(x => x != this.dataService.SelectedGHProject).forEach(x => {
      this.AvailableProjects.push({ key: x, name: x.name, tooltip: this.dataService.GetRepoOfFile(x)?.name + '/' + x.path });
    });
    this.dataService.AvailableFSProjects.filter(x => x.path != this.dataService.SelectedFSProject?.path).forEach(x => {
      this.AvailableProjects.push({ key: x, name: this.dataService.GetFileName(x.path), tooltip: x.path });
    });

    this.Details.push({ Key: false, Value: 'dialog.transferproject.d.Participants' });
    this.Details.push({ Key: false, Value: 'dialog.transferproject.d.CharScope' });
    this.Details.push({ Key: false, Value: 'dialog.transferproject.d.ObjImpact' });
    this.Details.push({ Key: false, Value: 'dialog.transferproject.d.Assets' });
    this.Details.push({ Key: false, Value: 'dialog.transferproject.d.ThreatSources' });
    this.Details.push({ Key: false, Value: 'dialog.transferproject.d.ThreatIdentification' });
    this.Details.push({ Key: false, Value: 'dialog.transferproject.d.Tags' });
    this.Details.push({ Key: false, Value: 'dialog.transferproject.d.ExportTemplates' });
  }

  public LoadProject() {
    const setDetails = (file: ProjectFile) => {
      if (file.Participants?.length == 0) this.Details.find(x => x.Value == 'dialog.transferproject.d.Participants').Key = null;
      if (file.GetProjectAssetGroup() == null || this.SourceProject.GetProjectAssetGroup() == null) this.Details.find(x => x.Value == 'dialog.transferproject.d.Assets').Key = null;
      if (file.GetThreatSources().Sources.length == 0) this.Details.find(x => x.Value == 'dialog.transferproject.d.ThreatSources').Key = null;
      if (file.GetSystemThreats().length == 0) this.Details.find(x => x.Value == 'dialog.transferproject.d.ThreatIdentification').Key = null;
    };

    this.Details.forEach(x => x.Key = false);
    if (this.SelectedProject.key['repoId'] == null) {
      this.dataService.ReadFSFile(this.SelectedProject.key).then((file) => {
        this.SourceProject = file;
        setDetails(file);
      }).catch(err => { });
    }
    else {
      this.dataService.ReadGHFile(this.SelectedProject.key).then((file) => {
        this.SourceProject = file;
        setDetails(file);
      }).catch(err => { });
    }
  }

  public TransferProject() {
    this.TransferLog = this.translate.instant('dialog.transferproject.l.start') + '\n';
    const currProj = this.dataService.Project;
    const srcProj = this.SourceProject;
    this.Details.filter(x => x.Key == true).forEach(key => {
      if (key.Value === 'dialog.transferproject.d.Participants') {
        srcProj.Participants.forEach(p => {
          if (!currProj.Participants.some(x => x.Name == p.Name && x.Email == p.Email)) {
            currProj.Participants.push({ Name: p.Name, Email: p.Email });
            this.TransferLog += this.translate.instant('dialog.transferproject.l.createParticipant') + ': ' + p.Name + '\n';
          }
        });
      }
      else if (key.Value === 'dialog.transferproject.d.CharScope') {
        const srcCS = srcProj.GetCharScope(); 
        const destCS = currProj.GetCharScope();
        srcCS.StepProperties.forEach(prop => {
          srcCS[prop].forEach(x => destCS[prop].push(x));
          if (srcCS[prop].length > 0) this.TransferLog += 'Update: ' + this.translate.instant('pages.modeling.charscope.' + prop) + '\n';
        });
      }
      else if (key.Value === 'dialog.transferproject.d.ObjImpact') {
        const srcOI = srcProj.GetObjImpact();
        const destOI = currProj.GetObjImpact();
        srcOI.StepProperties.forEach(prop => {
          srcOI[prop].forEach(x => destOI[prop].push(x));
          if (srcOI[prop].length > 0) this.TransferLog += 'Update: ' + this.translate.instant('pages.modeling.objimpact.' + prop) + '\n';
        });
      }
      else if (key.Value === 'dialog.transferproject.d.Assets') {
        const srcA = srcProj.GetProjectAssetGroup();
        const destA = currProj.GetProjectAssetGroup();
        if (srcA && destA) {
          const createMyData = (src: MyData, dest: AssetGroup) => {
            const myData = currProj.CreateMyData(dest);
            myData.CopyFrom(src.Data);
            this.TransferLog += this.translate.instant('dialog.transferproject.l.createMyData') + ': ' + myData.Name + '\n';
          };
          const createAssetRec = (src: AssetGroup, dest: AssetGroup) => {
            const asset = currProj.CreateAssetGroup(dest);
            asset.CopyFrom(src.Data);
            asset.Data['assetGroupIDs'] = [];
            asset.Data['associatedDataIDs'] = [];
            this.TransferLog += this.translate.instant('dialog.transferproject.l.createAsset') + ': ' + asset.Name + '\n';

            src.AssociatedData.forEach(x => createMyData(x, asset));
            src.SubGroups.forEach(x => createAssetRec(x, asset));
          };

          const compareAssetGroups = (srcG: AssetGroup, destG: AssetGroup) => {
            srcG.SubGroups.forEach(group => {
              if (!destG.SubGroups.some(x => x.Name === group.Name)) {
                createAssetRec(group, destG);
              }
            });
            srcG.AssociatedData.forEach(data => {
              if (!destG.AssociatedData.some(x => x.Name == data.Name)) {
                createMyData(data, destG);
              }
            });
            srcG.SubGroups.forEach(subGroup => {
              compareAssetGroups(subGroup, destG.SubGroups.find(x => x.Name == subGroup.Name));
            });
          };

          compareAssetGroups(srcA, destA);
        }
      }
      else if (key.Value === 'dialog.transferproject.d.ThreatSources') {
        const srcTS = srcProj.GetThreatSources();
        const destTS = currProj.GetThreatSources();
        srcTS.Sources.forEach(ts => {
          if (!destTS.Sources.some(x => x.Name == ts.Name)) {
            const actor = currProj.CreateThreatActor();
            actor.CopyFrom(ts.Data);
            destTS.AddThreatActor(actor);
            this.TransferLog += this.translate.instant('dialog.transferproject.l.createThreatActor') + ': ' + actor.Name + '\n';
          }
        });
      }
      else if (key.Value === 'dialog.transferproject.d.ThreatIdentification') {
        const destST = currProj.GetSystemThreats();
        srcProj.GetSystemThreats().forEach(st => {
          if (!destST.some(x => x.Name == st.Name)) {
            let cat = this.dataService.Config.GetThreatCategory(st.ThreatCategory.ID);
            if (!cat) cat = this.dataService.Config.GetThreatCategories().find(x => x.Name == st.ThreatCategory.Name);
            if (!cat) cat = this.dataService.Config.GetThreatCategories()[0];

            const threat = currProj.CreateSystemThreat(cat);
            threat.CopyFrom(st.Data);
            threat.ThreatCategory = cat;
            threat.Data['affectedAssetObjectIDs'] = [];
            const currAssets = currProj.GetAssetGroups();
            const currData = currProj.GetMyDatas();
            st.AffectedAssetObjects.forEach(obj => {
              let match: AssetGroup|MyData = currAssets.find(x => obj.Name == x.Name);
              if (!match) match = currData.find(x => obj.Name == x.Name);
              if (match) threat.AffectedAssetObjects = [...threat.AffectedAssetObjects, match];
            });
            this.TransferLog += this.translate.instant('dialog.transferproject.l.createSystemThreat') + ': ' + threat.Name + '\n';
          }
        });
      }
      else if (key.Value === 'dialog.transferproject.d.Tags') {
        srcProj.GetMyTags().forEach(tag => {
          if (!currProj.GetMyTags().some(x => x.Name == tag.Name)) {
            const t = currProj.CreateMyTag();
            t.CopyFrom(tag.Data);
            this.TransferLog += this.translate.instant('dialog.transferproject.l.createTag') + ': ' + t.Name + '\n';
          }
        });
      }
      else if (key.Value === 'dialog.transferproject.d.ExportTemplates') {
        srcProj.GetExportTemplates().forEach(temp => {
          if (!currProj.GetExportTemplates().some(x => x.Name == temp.Name)) {
            const t = currProj.CreateExportTemplate();
            t.CopyFrom(temp.Data);
            this.TransferLog += this.translate.instant('dialog.transferproject.l.createExportTemplate') + ': ' + t.Name + '\n';
          }
        });
      }
    });

    this.Details.forEach(x => x.Key = false);
    this.UpdateAllDetails();
    this.TransferLog += this.translate.instant('dialog.transferproject.l.finished') + '\n';
    this.dataService.ConsistencyCheck().then(res => {
      if (res) this.messageService.Success('messages.success.transferedProjectDetails');
      else this.messageService.Warning('messages.warning.transferedProjectDetails');
    });
  }

  public UpdateAllDetails() {
    this.AllDetails = this.Details.filter(x => x.Key != null).every(x => x.Key);
  }

  public SomeDetails(): boolean {
    return this.Details.filter(x => x.Key).length > 0 && !this.AllDetails;
  }

  public SetAll(completed: boolean) {
    this.AllDetails = completed;
    this.Details.filter(x => x.Key != null).forEach(x => (x.Key = completed));
  }

  public GetIcon(proj: IFileDetails): string {
    return proj.key['repoId'] == null ? 'file_present' : 'cloud_queue';
  }
}
