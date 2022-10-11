import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { MyDataComponent } from '../configuration/mydata/mydata.component';
import { ThreatOriginComponent } from '../configuration/threat-origin/threat-origin.component';
import { ThreatRuleComponent } from '../configuration/threat-rule/threat-rule.component';
import { MyData } from '../model/assets';
import { DatabaseBase, DataReferencesUtil, ViewElementBase } from '../model/database';
import { ThreatMapping, ThreatOrigin, ThreatRule } from '../model/threat-model';
import { MitigationMappingComponent } from '../modeling/mitigation-mapping/mitigation-mapping.component';
import { MitigationProcessComponent } from '../modeling/mitigation-process/mitigation-process.component';
import { ThreatMappingComponent } from '../modeling/threat-mapping/threat-mapping.component';
import { ProgressTrackerComponent } from '../shared/components/progress-tracker/progress-tracker.component';
import { ModelInfoComponent } from '../shared/components/model-info/model-info.component';

import { ITwoOptionDialogData, TwoOptionsDialogComponent } from '../shared/components/two-options-dialog/two-options-dialog.component';
import { DataService } from './data.service';
import { Mitigation, MitigationMapping, MitigationProcess } from '../model/mitigations';
import { MitigationComponent } from '../configuration/mitigation/mitigation.component';
import { SuggestedThreatsDialogComponent } from '../modeling/diagram/suggested-threats-dialog/suggested-threats-dialog.component';
import { DFDElement } from '../model/dfd-model';

export class MyBoolean {
  public Value: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor(private dialog: MatDialog, private translate: TranslateService, private dataService: DataService) { }

  public OpenTwoOptionsDialog(data: ITwoOptionDialogData, hasBackdrop = false, width = null): Observable<any> {
    const dialogRef = this.dialog.open(TwoOptionsDialogComponent, { hasBackdrop: hasBackdrop, data: data, width: width });
    return dialogRef.afterClosed();
  }

  public OpenUnsavedChangesDialog() {
    let data: ITwoOptionDialogData = {
      title: this.translate.instant('dialog.unsaved.title'),
      textContent: this.translate.instant('dialog.unsaved.save'),
      resultTrueText: this.translate.instant('general.Yes'),
      hasResultFalse: true,
      resultFalseText: this.translate.instant('general.No'),
      resultTrueEnabled: () => { return true; },
      initalTrue: true
    };
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenDeleteDialog(name: string): Observable<any> {
    let data: ITwoOptionDialogData = {
      title: this.translate.instant('dialog.delete.deleteItem') + ' ' + name,
      textContent: this.translate.instant('dialog.delete.sure'),
      resultTrueText: this.translate.instant('general.Yes'),
      hasResultFalse: true,
      resultFalseText: this.translate.instant('general.No'),
      resultTrueEnabled: () => { return true; },
      initalTrue: false
    };
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenDeleteObjectDialog(obj: DatabaseBase) {
    let refs = DataReferencesUtil.FindAllReferencesDeep(obj, this.dataService.Project, this.dataService.Config);
    //let refs = obj.FindReferences(this.dataService.Project, this.dataService.Config);
    let content = this.translate.instant('dialog.delete.sure');
    if (refs.length > 0) {
      content += '\n\n';
      content += this.translate.instant('dialog.delete.changes');
      refs.forEach(x => {
        content += '\n' + DataReferencesUtil.ToString(x, this.dataService, this.translate);
      });
    }

    let data: ITwoOptionDialogData = {
      title: this.translate.instant('dialog.delete.deleteItem') + ' ' + obj.Name,
      textContent: content,
      resultTrueText: this.translate.instant('general.Yes'),
      hasResultFalse: true,
      resultFalseText: this.translate.instant('general.No'),
      resultTrueEnabled: () => { return true; },
      initalTrue: false
    };
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenThreatMappingDialog(mapping: ThreatMapping, isNew: boolean) {
    let data: ITwoOptionDialogData = {
      title: this.translate.instant('pages.modeling.threatmapping.dialogTitle'),
      resultTrueText: isNew ? this.translate.instant('general.Add') : this.translate.instant('general.Close'),
      hasResultFalse: isNew,
      resultFalseText: this.translate.instant('general.Cancel'),
      resultTrueEnabled: () => {
        return !isNew || mapping.ThreatOrigin != null || mapping.ThreatCategories.length > 0;
      },
      initalTrue: false,
      component: ThreatMappingComponent,
      componentInputData: [
        { Key: ThreatMapping, Value: mapping }
      ]
    };
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenAddThreatOriginDialog(origin: ThreatOrigin) {
    let data: ITwoOptionDialogData = {
      title: this.translate.instant('pages.config.threatOriginEditDialogTitle'),
      resultTrueText: this.translate.instant('general.Add'),
      hasResultFalse: true,
      resultFalseText: this.translate.instant('general.Cancel'),
      resultTrueEnabled: () => {
        return origin.Name?.length > 0 && this.dataService.Config.FindGroupOfThreatOrigin(origin) != null;
      },
      initalTrue: false,
      component: ThreatOriginComponent,
      componentInputData: [
        { Key: ThreatOrigin, Value: origin }
      ]
    };
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenViewThreatOriginDialog(origin: ThreatOrigin, canEdit) {
    let edit = new MyBoolean();
    edit.Value = canEdit;
    let data: ITwoOptionDialogData = {
      title: this.translate.instant('pages.config.threatOriginViewDialogTitle'),
      resultTrueText: this.translate.instant('general.Close'),
      hasResultFalse: false,
      resultFalseText: '',
      resultTrueEnabled: () => true,
      initalTrue: true,
      component: ThreatOriginComponent,
      componentInputData: [
        { Key: ThreatOrigin, Value: origin },
        { Key: MyBoolean, Value: edit }
      ]
    };
    return this.OpenTwoOptionsDialog(data, true);
  }

  public OpenViewThreatRuleDialog(rule: ThreatRule) {
    let data: ITwoOptionDialogData = {
      title: this.translate.instant('pages.config.threatRuleViewDialogTitle'),
      resultTrueText: this.translate.instant('general.Close'),
      hasResultFalse: false,
      resultFalseText: '',
      resultTrueEnabled: () => true,
      initalTrue: true,
      component: ThreatRuleComponent,
      componentInputData: [
        { Key: ThreatRule, Value: rule }
      ]
    };
    return this.OpenTwoOptionsDialog(data, true);
  }

  public OpenAddMyDataDialog(myData: MyData) {
    let data: ITwoOptionDialogData = {
      title: this.translate.instant('dialog.mydata.addDialogTitle'),
      resultTrueText: this.translate.instant('general.Add'),
      hasResultFalse: true,
      resultFalseText: this.translate.instant('general.Cancel'),
      resultTrueEnabled: () => {
        return myData.Name?.length > 0 && myData.FindAssetGroup() != null;
      },
      initalTrue: false,
      component: MyDataComponent,
      componentInputData: [
        { Key: MyData, Value: myData }
      ]
    };
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenMitigationMappingDialog(mapping: MitigationMapping, isNew: boolean, elements: ViewElementBase[]) {
    let isNewWrapper = new MyBoolean();
    isNewWrapper.Value = isNew;
    let data: ITwoOptionDialogData = {
      title: this.translate.instant('pages.modeling.mitigationmapping.dialogTitle'),
      resultTrueText: isNew ? this.translate.instant('general.Add') : this.translate.instant('general.Close'),
      hasResultFalse: isNew,
      resultFalseText: this.translate.instant('general.Cancel'),
      resultTrueEnabled: () => {
        return !isNew || mapping.Mitigation != null || mapping.Targets.length > 0;
      },
      initalTrue: false,
      component: MitigationMappingComponent,
      componentInputData: [
        { Key: MitigationMapping, Value: mapping },
        { Key: MyBoolean, Value: isNewWrapper },
        { Key: Array, Value: elements }
      ]
    };
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenAddMitigationDialog(mit: Mitigation) {
    let data: ITwoOptionDialogData = {
      title: this.translate.instant('pages.config.mitigation.dialogTitle'),
      resultTrueText: this.translate.instant('general.Add'),
      hasResultFalse: true,
      resultFalseText: this.translate.instant('general.Cancel'),
      resultTrueEnabled: () => {
        return mit.Name?.length > 0 && this.dataService.Config.FindGroupOfMitigation(mit) != null;
      },
      initalTrue: false,
      component: MitigationComponent,
      componentInputData: [
        { Key: Mitigation, Value: mit }
      ]
    };
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenMitigationProcessDialog(proc: MitigationProcess, isNew: boolean) {
    let data: ITwoOptionDialogData = {
      title: this.translate.instant('pages.modeling.mitigationprocess.dialogTitle'),
      resultTrueText: isNew ? this.translate.instant('general.Add') : this.translate.instant('general.Close'),
      hasResultFalse: isNew,
      resultFalseText: this.translate.instant('general.Cancel'),
      resultTrueEnabled: () => {
        return true
      },
      initalTrue: false,
      component: MitigationProcessComponent,
      componentInputData: [
        { Key: MitigationProcess, Value: proc }
      ]
    };
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenSuggestThreatsDialog(element: DFDElement) {
    let data: ITwoOptionDialogData = {
      title: this.translate.instant('pages.modeling.diagram.suggestedthreats.dialogTitle'),
      resultTrueText: this.translate.instant('general.Close'),
      hasResultFalse: false,
      resultFalseText: '',
      resultTrueEnabled: () => true,
      initalTrue: false,
      component: SuggestedThreatsDialogComponent,
      componentInputData: [
        { Key: DFDElement, Value: element }
      ]
    };
    return this.OpenTwoOptionsDialog(data, true, '800px');
  }

  public OpenProgresstrackerDialog() {
    let data: ITwoOptionDialogData = {
      title: this.translate.instant('dialog.progress.title'),
      resultTrueText: this.translate.instant('general.Close'),
      hasResultFalse: false,
      resultFalseText: '',
      resultTrueEnabled: () => true,
      initalTrue: true,
      component: ProgressTrackerComponent
    };
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenModelInfoDialog() {
    let data: ITwoOptionDialogData = {
      title: this.translate.instant('dialog.modelinfo.title'),
      resultTrueText: this.translate.instant('general.Close'),
      hasResultFalse: false,
      resultFalseText: '',
      resultTrueEnabled: () => true,
      initalTrue: true,
      component: ModelInfoComponent
    };
    return this.OpenTwoOptionsDialog(data);
  }
}
