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

  public static ProjectVersion = 3;
  public static ConfigVersion = 2;

  private configUpdates = [
    this.configV2
  ];

  private projectUpdates = [
    this.projectV2,
    this.projectV3
  ];

  constructor(private messageService: MessagesService, private translate: TranslateService) { }

  public UpdateProjectFile(file: IProjectFile): boolean {
    let res = this.UpdateConfigFile(file.config as IConfigFile);
    res = res || this.updateFile(file, false);
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
    file.deviceThreats.forEach(cat => {
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

  private configV2(file: IConfigFile) {
    file.threatOrigins.forEach(origin => {
      let res = [];
      for (const [k, v] of Object.entries(origin['ThreatIntroduced'])) {
        if (v == true) res.push(k);
      }
      origin['ThreatIntroduced'] = res;
      res = [];
      for (const [k, v] of Object.entries(origin['ThreatExploited'])) {
        if (v == true) res.push(k);
      }
      origin['ThreatExploited'] = res;
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
}
