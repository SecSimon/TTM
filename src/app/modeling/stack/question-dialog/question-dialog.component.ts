import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MyComponent } from '../../../model/component';
import { OptionTypes, OptionTypesUtil, RuleTypes, AttackVector, ThreatQuestion } from '../../../model/threat-model';
import { DataService } from '../../../util/data.service';
import { DialogService } from '../../../util/dialog.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-question-dialog',
  templateUrl: './question-dialog.component.html',
  styleUrls: ['./question-dialog.component.scss']
})
export class QuestionDialogComponent implements OnInit {

  public get components(): MyComponent[] {
    return this.data['components'];
  }

  public get selectedComponent(): MyComponent { return this.data['selectedComponent']; }
  public set selectedComponent(val: MyComponent) { 
    this.data['selectedComponent'] = val; 
    this.selectedTabIndex = this.components.indexOf(this.selectedComponent);
  }

  public selectedTabIndex: number = 0;

  public get canNext(): boolean { 
    if (this.components.length <= 1) return false;
    return this.selectedComponent != this.components[this.components.length-1];
  }

  public get canPrev(): boolean { 
    if (this.components.length <= 1) return false;
    return this.selectedComponent != this.components[0];
  }

  constructor(public dialogRef: MatDialogRef<QuestionDialogComponent>, @Inject(MAT_DIALOG_DATA) public data, public dataService: DataService, private dialog: DialogService, private router: Router) { 
  }

  ngOnInit(): void {
    this.selectedComponent = this.selectedComponent; // refresh index
    setTimeout(() => {
      this.components.filter(x => !x.UserCheckedElement).forEach(x => {
        if (Object.values(x.ThreatQuestions).filter(x => x == null).length == 0) x.UserCheckedElement = true;
      });
    }, 10);
  }

  public OnQuestionAnswered(event, quest: ThreatQuestion) {
    this.selectedComponent.ThreatQuestions[quest.ID] = event.value;
    let op = OptionTypesUtil.GetOptions(quest.OptionType).find(x => x.Value == event.value);
    let change = quest.ChangesPerOption[op.Key];
    this.selectedComponent.SetProperty(quest.Property?.ID, change['Value']);
  }

  public OpenAttackVectors(quest: ThreatQuestion) {
    let tos = this.GetAssociatedAttackVectors(quest);
    tos.forEach(x => {
      this.dialog.OpenViewAttackVectorDialog(x, false);
    });
  }

  public OpenNotes(quest: ThreatQuestion) {
    if (this.selectedComponent.NotesPerQuestion[quest.ID] == null) this.selectedComponent.NotesPerQuestion[quest.ID] = [];
    const notes = this.selectedComponent.NotesPerQuestion[quest.ID];
    this.dialog.OpenNotesDialog(notes, true, false, true, true);
  }

  public GetUnsetThreats(comp: MyComponent): string {
    let cnt = Object.values(comp.ThreatQuestions).filter(x => x === null).length;
    if (cnt == 0 && !comp.UserCheckedElement) {
      setTimeout(() => {
        comp.UserCheckedElement = true;
      }, 100);
      return '';
    }

    return cnt.toString();
  }

  public GetNotesCountOfQuestion(quest: ThreatQuestion): number {
    if (this.selectedComponent.NotesPerQuestion[quest.ID]) {
      return this.selectedComponent.NotesPerQuestion[quest.ID].length;
    }
    return 0;
  }

  public GetAssociatedAttackVectors(quest: ThreatQuestion): AttackVector[] {
    let res: AttackVector[] = [];

    if (quest.Property != null) {
      let rules = this.dataService.Config.GetThreatRules().filter(x => x.RuleType == RuleTypes.Component && x.ComponentRestriction.componentTypeID == this.selectedComponent.Type.ID);
      rules = rules.filter(x => x.ComponentRestriction.DetailRestrictions.some(y => y.PropertyRest.ID == quest.Property.ID));
      res.push(...rules.filter(x => x.AttackVector != null).map(x => x.AttackVector));
    }

    return res;
  }

  public GetThreatQuestions(comp: MyComponent) {
    let res: ThreatQuestion[] = [];
    Object.keys(comp.ThreatQuestions).forEach(x => res.push(this.dataService.Config.GetThreatQuestion(x)));
    return res;
  }

  public GetOptionKeys(ot: OptionTypes) {
    return OptionTypesUtil.GetOptions(ot).map(x => x.Key);
  }
  public GetOptionValue(ot: OptionTypes, key: string) {
    return OptionTypesUtil.GetOptions(ot).find(x => x.Key == key).Value;
  }

  public GetOptionValues(ot: OptionTypes) {
    return OptionTypesUtil.GetOptions(ot)
  }

  public Next() {
    this.selectedComponent = this.components[this.components.indexOf(this.selectedComponent)+1]; 
  }

  public Prev() {
    this.selectedComponent = this.components[this.components.indexOf(this.selectedComponent)-1];
  }

  public NavigateToSettings() {
    this.router.navigate(['configuration'], {
      queryParams: { index: this.selectedComponent.Type.ComponentTypeID }
    });
  }
}
