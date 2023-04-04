import { EventEmitter, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { MyDataComponent } from '../configuration/mydata/mydata.component';
import { AttackVectorComponent } from '../configuration/attack-vector/attack-vector.component';
import { ThreatRuleComponent } from '../configuration/threat-rule/threat-rule.component';
import { MyData } from '../model/assets';
import { DatabaseBase, DataReferencesUtil, INote, IProperty, ViewElementBase } from '../model/database';
import { AttackScenario, ICVSSEntry, IOwaspRREntry, AttackVector, ThreatRule } from '../model/threat-model';
import { CountermeasureComponent } from '../modeling/countermeasure/countermeasure.component';
import { MitigationProcessComponent } from '../modeling/mitigation-process/mitigation-process.component';
import { AttackScenarioComponent } from '../modeling/attack-scenario/attack-scenario.component';
import { ProgressTrackerComponent } from '../shared/components/progress-tracker/progress-tracker.component';
import { ModelInfoComponent } from '../shared/components/model-info/model-info.component';

import { ITwoOptionDialogData, TwoOptionsDialogComponent } from '../shared/components/two-options-dialog/two-options-dialog.component';
import { DataService } from './data.service';
import { Control, Countermeasure, MitigationProcess } from '../model/mitigations';
import { ControlComponent } from '../configuration/control/control.component';
import { SuggestedThreatsDialogComponent } from '../modeling/diagram/suggested-threats-dialog/suggested-threats-dialog.component';
import { DFDElement } from '../model/dfd-model';
import { NotesComponent } from '../shared/components/notes/notes.component';
import { LocalStorageService, LocStorageKeys } from './local-storage.service';
import { CvssEntryComponent } from '../shared/components/cvss-entry/cvss-entry.component';
import { OwaspRREntryComponent } from '../shared/components/owasp-rr-entry/owasp-rr-entry.component';
import { RenameDialogComponent, IRenameDialogData } from '../shared/components/rename-dialog/rename-dialog.component';
import { TagChartsComponent } from '../dashboard/tag-charts/tag-charts.component';
import { CveSearchComponent } from '../shared/components/cve-search/cve-search.component';
import { TestCase } from '../model/test-case';
import { TestCaseComponent } from '../modeling/test-case/test-case.component';
import { ImageViewComponent } from '../shared/components/image-view/image-view.component';
import { GlossaryComponent } from '../shared/components/glossary/glossary.component';

export class MyBoolean {
  public Value: boolean;
}

export class MyString {
  public Value: string;
}

export class NoteConfig {
  public Notes: INote[];
  public ShowTimestamp: boolean;
  public HasCheckbox: boolean;
  public CanToggleTimestamp: boolean;
  public CanToggleCheckbox: boolean;
}

export class MyCVSSEntry {
  public Value: ICVSSEntry;
}

export class MyOwaspRREntry {
  public Value: IOwaspRREntry;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor(private dialog: MatDialog, private translate: TranslateService, public dataService: DataService, private locStorage: LocalStorageService) { }

  public OpenTwoOptionsDialog(data: ITwoOptionDialogData, hasBackdrop = false, width = null): Observable<any> {
    const dialogRef = this.dialog.open(TwoOptionsDialogComponent, { hasBackdrop: hasBackdrop, data: data, width: width });
    return dialogRef.afterClosed();
  }

  public OpenUnsavedChangesDialog() {
    const data: ITwoOptionDialogData = {
      title: this.translate.instant('dialog.unsaved.title'),
      textContent: this.translate.instant('dialog.unsaved.saveProject'),
      resultTrueText: this.translate.instant('general.Yes'),
      hasResultFalse: true,
      resultFalseText: this.translate.instant('general.No'),
      resultTrueEnabled: () => { return true; },
      initalTrue: true
    };
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenDeleteDialog(name: string): Observable<any> {
    const data: ITwoOptionDialogData = {
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

    const data: ITwoOptionDialogData = {
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

  public OpenAttackScenarioDialog(scenario: AttackScenario, isNew: boolean, scenarios: AttackScenario[] = null) {
    const data: ITwoOptionDialogData = {
      title: this.translate.instant('pages.modeling.attackscenario.dialogTitle'),
      resultTrueText: isNew ? this.translate.instant('general.Add') : this.translate.instant('general.Close'),
      hasResultFalse: isNew,
      resultFalseText: this.translate.instant('general.Cancel'),
      resultTrueEnabled: () => {
        return !isNew || scenario.ThreatCategories.length > 0;
      },
      initalTrue: false,
      component: AttackScenarioComponent,
      componentInputData: [
        { Key: AttackScenario, Value: scenario }
      ]
    };
    if (scenarios) {
      data.canIterate = true;
      let curr = scenario;
      const onChange = new EventEmitter<AttackScenario>();
      data.componentInputData.push({ Key: EventEmitter<AttackScenario>, Value: onChange });
      data.canNext = () => { return scenarios.indexOf(curr) < scenarios.length-1; };
      data.canPrevious = () => { return scenarios.indexOf(curr) > 0; };
      data.onNext = () => { 
        curr = scenarios[scenarios.indexOf(curr)+1];
        onChange.emit(curr);
      };
      data.onPrevious = () => {
        curr = scenarios[scenarios.indexOf(curr)-1];
        onChange.emit(curr);
      };
    }
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenAddAttackVectorDialog(vector: AttackVector) {
    const data: ITwoOptionDialogData = {
      title: this.translate.instant('pages.config.attackVectorEditDialogTitle'),
      resultTrueText: this.translate.instant('general.Add'),
      hasResultFalse: true,
      resultFalseText: this.translate.instant('general.Cancel'),
      resultTrueEnabled: () => {
        return vector.Name?.length > 0 && this.dataService.Config.FindGroupOfAttackVector(vector) != null;
      },
      initalTrue: false,
      component: AttackVectorComponent,
      componentInputData: [
        { Key: AttackVector, Value: vector }
      ]
    };
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenViewAttackVectorDialog(vector: AttackVector, canEdit) {
    const edit = new MyBoolean();
    edit.Value = canEdit;
    const data: ITwoOptionDialogData = {
      title: this.translate.instant('pages.config.attackVectorViewDialogTitle'),
      resultTrueText: this.translate.instant('general.Close'),
      hasResultFalse: false,
      resultFalseText: '',
      resultTrueEnabled: () => true,
      initalTrue: true,
      component: AttackVectorComponent,
      componentInputData: [
        { Key: AttackVector, Value: vector },
        { Key: MyBoolean, Value: edit }
      ]
    };
    return this.OpenTwoOptionsDialog(data, true);
  }

  public OpenViewThreatRuleDialog(rule: ThreatRule) {
    const data: ITwoOptionDialogData = {
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

  public OpenCVSSEntryDiaglog(entry: ICVSSEntry) {
    const val = new MyCVSSEntry();
    val.Value = entry;
    const data: ITwoOptionDialogData = {
      title: this.translate.instant('shared.cvss.name.l'),
      resultTrueText: this.translate.instant('general.Close'),
      hasResultFalse: false,
      resultFalseText: '',
      resultTrueEnabled: () => true,
      initalTrue: true,
      component: CvssEntryComponent,
      componentInputData: [
        { Key: MyCVSSEntry, Value: val }
      ]
    };
    return this.OpenTwoOptionsDialog(data, true);
  }

  public OpenOwaspRREntryDiaglog(entry: IOwaspRREntry) {
    const val = new MyOwaspRREntry();
    val.Value = entry;
    const data: ITwoOptionDialogData = {
      title: this.translate.instant('shared.owasprr.name.l'),
      resultTrueText: this.translate.instant('general.Close'),
      hasResultFalse: false,
      resultFalseText: '',
      resultTrueEnabled: () => true,
      initalTrue: true,
      component: OwaspRREntryComponent,
      componentInputData: [
        { Key: MyOwaspRREntry, Value: val }
      ]
    };
    return this.OpenTwoOptionsDialog(data, true);
  }

  public OpenAddMyDataDialog(myData: MyData) {
    const data: ITwoOptionDialogData = {
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

  public OpenCountermeasureDialog(measure: Countermeasure, isNew: boolean, elements: ViewElementBase[], measures: Countermeasure[] = null) {
    let isNewWrapper = new MyBoolean();
    isNewWrapper.Value = isNew;
    const data: ITwoOptionDialogData = {
      title: this.translate.instant('pages.modeling.countermeasure.dialogTitle'),
      resultTrueText: isNew ? this.translate.instant('general.Add') : this.translate.instant('general.Close'),
      hasResultFalse: isNew,
      resultFalseText: this.translate.instant('general.Cancel'),
      resultTrueEnabled: () => {
        return !isNew || measure.Control != null || measure.Targets.length > 0;
      },
      initalTrue: false,
      component: CountermeasureComponent,
      componentInputData: [
        { Key: Countermeasure, Value: measure },
        { Key: MyBoolean, Value: isNewWrapper },
        { Key: Array, Value: elements }
      ]
    };
    if (measures) {
      data.canIterate = true;
      let curr = measure;
      const onChange = new EventEmitter<Countermeasure>();
      data.componentInputData.push({ Key: EventEmitter<Countermeasure>, Value: onChange });
      data.canNext = () => { return measures.indexOf(curr) < measures.length-1; };
      data.canPrevious = () => { return measures.indexOf(curr) > 0; };
      data.onNext = () => { 
        curr = measures[measures.indexOf(curr)+1];
        onChange.emit(curr);
      };
      data.onPrevious = () => {
        curr = measures[measures.indexOf(curr)-1];
        onChange.emit(curr);
      };
    }
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenTestCaseDialog(tc: TestCase, isNew: boolean) {
    const data: ITwoOptionDialogData = {
      title: this.translate.instant('general.TestCase'),
      resultTrueText: isNew ? this.translate.instant('general.Add') : this.translate.instant('general.Close'),
      hasResultFalse: isNew,
      resultFalseText: this.translate.instant('general.Cancel'),
      resultTrueEnabled: () => { return true },
      initalTrue: false,
      component: TestCaseComponent,
      componentInputData: [
        { Key: TestCase, Value: tc }
      ]
    };
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenAddControlDialog(mit: Control) {
    const edit = new MyBoolean();
    edit.Value = true;
    const data: ITwoOptionDialogData = {
      title: this.translate.instant('pages.config.control.dialogTitle'),
      resultTrueText: this.translate.instant('general.Add'),
      hasResultFalse: true,
      resultFalseText: this.translate.instant('general.Cancel'),
      resultTrueEnabled: () => {
        return mit.Name?.length > 0 && this.dataService.Config.FindGroupOfControl(mit) != null;
      },
      initalTrue: false,
      component: ControlComponent,
      componentInputData: [
        { Key: Control, Value: mit },
        { Key: MyBoolean, Value: edit }
      ]
    };
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenMitigationProcessDialog(proc: MitigationProcess, isNew: boolean) {
    const data: ITwoOptionDialogData = {
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
    const data: ITwoOptionDialogData = {
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

  public OpenCveSearchDialog(element: ViewElementBase, viewID: string) {
    let str = new MyString();
    str.Value = viewID;
    const data: ITwoOptionDialogData = {
      title: this.translate.instant('shared.cvesearch.title'),
      resultTrueText: this.translate.instant('general.Close'),
      hasResultFalse: false,
      resultFalseText: '',
      resultTrueEnabled: () => true,
      initalTrue: false,
      component: CveSearchComponent,
      componentInputData: [
        { Key: ViewElementBase, Value: element },
        { Key: MyString, Value: str }
      ]
    };
    return this.OpenTwoOptionsDialog(data, true, '800px');
  }

  public OpenProgresstrackerDialog() {
    const data: ITwoOptionDialogData = {
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

  public OpenNotesDialog(notes: INote[], showTimestamp = false, hasCheckbox = false, canToggleTimestamp = false, canToggleCheckbox = false) {
    let config = new NoteConfig();
    config.Notes = notes;
    config.HasCheckbox = hasCheckbox;
    config.ShowTimestamp = showTimestamp;
    config.CanToggleTimestamp = canToggleTimestamp;
    config.CanToggleCheckbox = canToggleCheckbox;
    const data: ITwoOptionDialogData = {
      title: this.translate.instant('general.Notes'),
      resultTrueText: this.translate.instant('general.Close'),
      hasResultFalse: false,
      resultFalseText: '',
      resultTrueEnabled: () => true,
      initalTrue: true,
      component: NotesComponent,
      componentInputData: [
        { Key: NoteConfig, Value: config }
      ]
    };
    return this.OpenTwoOptionsDialog(data, true, 800);
  }

  public OpenModelInfoDialog() {
    const data: ITwoOptionDialogData = {
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

  public OpenCookieConsentDialog() {
    const data: ITwoOptionDialogData = {
      title: this.translate.instant('dialog.cookie.title'),
      textContent: this.translate.instant('dialog.cookie.text'),
      initalTrue: false,
      hasResultFalse: true,
      resultTrueText: this.translate.instant('dialog.cookie.consent'),
      resultFalseText: this.translate.instant('dialog.cookie.reject'),
      resultTrueEnabled: () => true
    };
    const dialogRef = this.OpenTwoOptionsDialog(data, false, '600px');
    dialogRef.subscribe(res => {
      this.locStorage.Set(LocStorageKeys.COOKIE_CONSENT, JSON.stringify(res));
    });
    return dialogRef;
  }

  public OpenGlossaryDialog() {
    const data: ITwoOptionDialogData = {
      title: this.translate.instant('side-nav.Glossary'),
      resultTrueText: this.translate.instant('general.Close'),
      hasResultFalse: false,
      resultFalseText: '',
      resultTrueEnabled: () => true,
      initalTrue: true,
      component: GlossaryComponent
    };
    return this.OpenTwoOptionsDialog(data);
  }

  public OpenRenameDialog(obj: DatabaseBase, prop: IProperty) {
    const data: IRenameDialogData = { Object: obj, Property: prop };
    const dialogRef = this.dialog.open(RenameDialogComponent, { data: data });
    return dialogRef;
  }

  public OpenTagChartsDialog() {
    const data: ITwoOptionDialogData = {
      title: this.translate.instant('dialog.tagcharts.title'),
      resultTrueText: this.translate.instant('general.Close'),
      hasResultFalse: false,
      resultFalseText: '',
      resultTrueEnabled: () => true,
      initalTrue: true,
      component: TagChartsComponent
    };
    return this.OpenTwoOptionsDialog(data, true, '700px');
  }

  public OpenViewImageDialog(img: string, wid = '700px') {
    const myStr = new MyString();
    myStr.Value = img;
    const data: ITwoOptionDialogData = {
      title: this.translate.instant('general.Image'),
      resultTrueText: this.translate.instant('general.Close'),
      hasResultFalse: false,
      resultFalseText: '',
      resultTrueEnabled: () => true,
      initalTrue: true,
      component: ImageViewComponent,
      componentInputData: [
        { Key: MyString, Value: myStr }
      ]
    };
    return this.OpenTwoOptionsDialog(data, true, wid);
  }
}
