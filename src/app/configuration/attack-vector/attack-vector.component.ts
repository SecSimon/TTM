import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit, Optional } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Control } from '../../model/mitigations';
import { LifeCycle, LifeCycleUtil, RestrictionUtil, ThreatCategoryGroup, AttackVector, AttackVectorGroup, AttackVectorTypes, AttackVectorTypesUtil, ThreatQuestion, ThreatRule, ThreatSeverities, ThreatSeverityUtil } from '../../model/threat-model';
import { DataService } from '../../util/data.service';
import { MyBoolean } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-attack-vector',
  templateUrl: './attack-vector.component.html',
  styleUrls: ['./attack-vector.component.scss']
})
export class AttackVectorComponent implements OnInit {
  private _attackVector;

  public get attackVector(): AttackVector { return this._attackVector; }
  @Input() public set attackVector(val: AttackVector) { 
    this._attackVector = val;
    this.selectedControl = null;
  }
  @Input() public canEdit: boolean = true;
  public isShownInDialog: boolean = false;

  public selectedControl: Control;

  constructor(@Optional() vector: AttackVector, @Optional() canEdit: MyBoolean, public theme: ThemeService, public dataService: DataService, private translate: TranslateService) { 
    if (vector) {
      this.attackVector = vector;
      this.isShownInDialog = true;
    }
    if (canEdit != null) {
      this.canEdit = canEdit.Value;
    }
  }

  ngOnInit(): void {
  }

  public GetAttackVectorTypes() {
    return AttackVectorTypesUtil.GetTypes();
  }

  public GetAttackVectorTypeName(t: AttackVectorTypes) {
    return AttackVectorTypesUtil.ToString(t);
  }

  public LifeCycleChanged(arr: string[], lc) {
    const index = arr.indexOf(lc);
    if (index >= 0) arr.splice(index, 1);
    else arr.push(lc);
  }

  public GetLifeCycles() {
    return LifeCycleUtil.GetKeys();
  }

  public GetLifeCycleName(lc: LifeCycle) {
    return LifeCycleUtil.ToString(lc);
  }

  public GetSeverityTypes() {
    return ThreatSeverityUtil.GetTypes();
  }

  public GetSeverityTypeName(sev: ThreatSeverities) {
    return ThreatSeverityUtil.ToString(sev);
  }

  public GetRootAttackVectorGroups(): AttackVectorGroup[] {
    return this.dataService.Config.ThreatLibrary.SubGroups;
  }

  public GetAttackVectorGroup(): AttackVectorGroup {
    return this.dataService.Config.FindGroupOfAttackVector(this.attackVector);
  }

  public GetThreatCategoryGroups(): ThreatCategoryGroup[] {
    return this.dataService.Config.GetThreatCategoryGroups().filter(x => x.ThreatCategories.length > 0);
  }

  public GetThreatRules(): ThreatRule[] {
    return this.dataService.Config.GetThreatRules().filter(x => x.AttackVector?.ID == this.attackVector.ID);
  }

  public GetThreatRestriction(rule: ThreatRule): string {
    return RestrictionUtil.ToString(rule, this.dataService, this.translate);
  }

  public GetPossibleControls() {
    return this.dataService.Config.GetControls().filter(x => !x.MitigatedAttackVectors.includes(this.attackVector));
  }

  public AddExistingControl(mit: Control) {
    mit.AddMitigatedAttackVector(this.attackVector);
  }

  public AddControl() {
    let mit = this.dataService.Config.CreateControl(this.dataService.Config.ControlLibrary);
    mit.AddMitigatedAttackVector(this.attackVector);
    this.selectedControl = mit;
  }

  public RemoveControl(mit: Control) {
    mit.RemoveMitigatedAttackVector(this.attackVector);
    if (mit == this.selectedControl) this.selectedControl = null;
  }

  public DeleteControl(mit: Control) {
    this.dataService.Config.DeleteControl(mit);
    if (mit == this.selectedControl) this.selectedControl = null;
  }

  public GetControls(): Control[] {
    return this.dataService.Config.GetControls().filter(x => x.MitigatedAttackVectors.includes(this.attackVector));
  }

  public OnGroupChanged(event) {
    let group = this.dataService.Config.GetAttackVectorGroup(event.value);
    let curr = this.dataService.Config.FindGroupOfAttackVector(this.attackVector);
    if (curr) {
      curr.RemoveAttackVector(this.attackVector);
    }
    group.AddAttackVector(this.attackVector);
  }

  public dropControl(event: CdkDragDrop<string[]>, selectedArray) {
    const prev = this.dataService.Config.GetControls().indexOf(selectedArray[event.previousIndex]);
    const curr = this.dataService.Config.GetControls().indexOf(selectedArray[event.currentIndex]);
    moveItemInArray(this.dataService.Config.GetControls(), prev, curr);
  }
}
