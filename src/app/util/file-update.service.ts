import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { IConfigFile } from './../model/config-file';
import { IProjectFile } from './../model/project-file';

import { MessagesService } from './messages.service';
import { StringExtension } from './string-extension';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class FileUpdateService {

  public static ProjectVersion = 6;
  public static ConfigVersion = 4;

  private configUpdates = [
    this.configV2,
    this.configV3,
    this.configV4
  ];

  private projectUpdates = [
    this.projectV2,
    this.projectV3,
    this.projectV4,
    this.projectV5,
    this.projectV6
  ];

  constructor(private messageService: MessagesService, private translate: TranslateService) { }

  public UpdateProjectFile(file: IProjectFile): boolean {
    let res = this.UpdateConfigFile(file.config as IConfigFile);
    if (res) res = this.updateFile(file, false);
    return res;
  }

  public UpdateConfigFile(file: IConfigFile): boolean {
    return this.updateFile(file, true);
  }

  private updateFile(file, isConfig: boolean): boolean {
    const currVersion: number = isConfig ? FileUpdateService.ConfigVersion : FileUpdateService.ProjectVersion;
    const msgName: string = isConfig ? 'Config' : 'Project';
    const updates = isConfig ? this.configUpdates : this.projectUpdates;

    if (file.Data['Version'] != currVersion) {
      const v: number = file.Data['Version'];
      try {
        for (let i = file.Data['Version']+1; i <= currVersion; i++) {
          updates[i-2](file);
          file.Data['Version'] = i;
        }
        setTimeout(() => {
          this.messageService.Success(StringExtension.Format(this.translate.instant('messages.success.updated' + msgName), v.toString(), currVersion.toString()));
        }, 1000);
        return true;
      } 
      catch (error) {
        setTimeout(() => {
          this.messageService.Error(StringExtension.Format(this.translate.instant('messages.erorr.updateFailed' + msgName), v.toString(), currVersion.toString()), error);
        }, 1000);
      }
    }

    return false;
  }

  private projectV2(file: IProjectFile) {
    file.systemThreats.forEach(cat => {
      const secGoalNames: string[] = [
        'Confidentiality', 'Integrity', 'Availability',
        'Authorization', 'Authenticity', 'Non-repudiation',
        'Auditability', 'Trustworthiness', 
        'Safety', 'Privacy', 'Compliance',
        'Financial', 'Reputation', 'Customer Satisfcation', 'Production Process'
      ];
      let res = [];
      for (const [k, v] of Object.entries(cat['ImpactCats'])) {
        if (v == true) res.push(secGoalNames.indexOf(k)+1);
      }
      cat['ImpactCats'] = res;
    });
  }

  private projectV3(file: IProjectFile) {
    let ids = [];
    file.threatActors = [];
    file.threatSources['Sources'].forEach(x => {
      const id = uuidv4();
      file.threatActors.push({ ID: id, Name: x['Name'], Description: '', Likelihood: x['Likelihood'], Motive: x['Motive'] });
      ids.push(id);
    });
    delete file.threatSources['Sources'];
    file.threatSources['sourceIDs'] = ids;
  }

  private projectV4(file: IProjectFile) {
    let updateTask = (task) => {
      task['Note'] = task['Task'];
      delete task['Task'];
      task['IsChecked'] = task['IsDone'];
      delete task['IsDone'];
      task['Author'] = '';
      task['Date'] = '';
      task['ShowTimestamp'] = false;
      task['HasCheckbox'] = true;
    };
    if (file.Data['Tasks']) {
      file.Data['Tasks'].forEach(task => updateTask(task));
    }
    if (file.mitigationProcesses) {
      file.mitigationProcesses.forEach(proc => {
        if (proc['Tasks']) {
          proc['Tasks'].forEach(task => updateTask(task));
        }
      });
    }
  }

  private projectV5(file: IProjectFile) {
    if (file['threatMappings']) {
      FileUpdateService.renameKey(file, 'threatMappings', 'attackScenarios');

      file['attackScenarios'].forEach(x => {
        if (x['deviceThreatIDs']) {
          FileUpdateService.renameKey(file, 'deviceThreatIDs', 'systemThreatIDs');
        }
      });
    }
    if (file['deviceThreats']) {
      FileUpdateService.renameKey(file, 'deviceThreats', 'systemThreats');
    }

    if (file['mitigationMappings']) {
      FileUpdateService.renameKey(file, 'mitigationMappings', 'countermeasures');
    }
    if (file['countermeasures']) {
      file['countermeasures'].forEach(x => {
        if (x['threatMappingIDs']) {
          FileUpdateService.renameKey(file, 'threatMappingIDs', 'attackScenarioIDs');
        }
      })
    }

    if (file['countermeasures']) {
      file['countermeasures'].forEach(x => {
        FileUpdateService.renameKey(x, 'mitigationID', 'controlID');
      })
    }
  }

  private projectV6(file: IProjectFile) {
    if (file['attackScenarios']) {
      file.attackScenarios.forEach(x => {
        if (x['Mapping'] && x['Mapping']['Threat']) FileUpdateService.renameKey(x['Mapping']['Threat'], 'ThreatOriginID', 'AttackVectorID');
      });
    }
  }

  private configV2(file: IConfigFile) {
    file.attackVectors.forEach(vector => {
      let res = [];
      for (const [k, v] of Object.entries(vector['ThreatIntroduced'])) {
        if (v == true) res.push(k);
      }
      vector['ThreatIntroduced'] = res;
      res = [];
      for (const [k, v] of Object.entries(vector['ThreatExploited'])) {
        if (v == true) res.push(k);
      }
      vector['ThreatExploited'] = res;
    });

    file.threatCategories.forEach(cat => {
      const secGoalNames: string[] = [
        'Confidentiality', 'Integrity', 'Availability',
        'Authorization', 'Authenticity', 'Non-repudiation',
        'Auditability', 'Trustworthiness', 
        'Safety', 'Privacy', 'Compliance',
        'Financial', 'Reputation', 'Customer Satisfcation', 'Production Process'
      ];
      let res = [];
      for (const [k, v] of Object.entries(cat['ImpactCats'])) {
        if (v == true) res.push(secGoalNames.indexOf(k)+1);
      }
      cat['ImpactCats'] = res;
    });
  }

  private configV3(file: IConfigFile) {
    if (file['Data']['mitigationLibraryID']) {
      FileUpdateService.renameKey(file['Data'], 'mitigationLibraryID', 'controlLibraryID');
    }
    if (file['mitigations']) {
      FileUpdateService.renameKey(file, 'mitigations', 'controls');
    }
    if (file['mitigationGroups']) {
      FileUpdateService.renameKey(file, 'mitigationGroups', 'controlGroups');
      file['controlGroups'].forEach(x => {
        FileUpdateService.renameKey(x, 'mitigationGroupIDs', 'controlGroupIDs');
        FileUpdateService.renameKey(x, 'mitigationIDs', 'controlIDs');
      });
    }
  }

  private configV4(file: IConfigFile) {
    if (file['attackVectorGroups']) {
      console.log('Failed previous update');
      if (file['controls']) {
        file.controls.forEach(x => {
          FileUpdateService.renameKey(x, 'mitigatedattackVectorIDs', 'mitigatedAttackVectorIDs');
        });
      }
      return;
    }
    if (file['threatOrigins'] && file['threatOriginGroups']) {
      FileUpdateService.renameKey(file, 'threatOriginGroups', 'attackVectorGroups');
      FileUpdateService.renameKey(file, 'threatOrigins', 'attackVectors');

      file['attackVectorGroups'].forEach(x => {
        FileUpdateService.renameKey(x, 'threatOriginGroupIDs', 'attackVectorGroupIDs');
        FileUpdateService.renameKey(x, 'threatOriginIDs', 'attackVectorIDs');
      });
    }
    if (file['controls']) {
      file.controls.forEach(x => {
        FileUpdateService.renameKey(x, 'mitigatedThreatOriginIDs', 'mitigatedAttackVectorIDs');
      });
    }
    if (file['threatRules']) {
      file.threatRules.forEach(x => {
        if (x['Mapping']) FileUpdateService.renameKey(x['Mapping'], 'ThreatOriginID', 'AttackVectorID');
      });
    }
  }

  private static renameKey(obj: {}, oldKey: string, newKey: string) {
    obj[newKey] = obj[oldKey];
    delete obj[oldKey];
  }
}
