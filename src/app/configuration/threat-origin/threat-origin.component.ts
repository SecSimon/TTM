import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit, Optional } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Control } from '../../model/mitigations';
import { LifeCycle, LifeCycleUtil, RestrictionUtil, ThreatCategoryGroup, ThreatOrigin, ThreatOriginGroup, ThreatOriginTypes, ThreatOriginTypesUtil, ThreatQuestion, ThreatRule, ThreatSeverities, ThreatSeverityUtil } from '../../model/threat-model';
import { DataService } from '../../util/data.service';
import { MyBoolean } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-threat-origin',
  templateUrl: './threat-origin.component.html',
  styleUrls: ['./threat-origin.component.scss']
})
export class ThreatOriginComponent implements OnInit {
  private _threatOrigin;

  public get threatOrigin(): ThreatOrigin { return this._threatOrigin; }
  @Input() public set threatOrigin(val: ThreatOrigin) { 
    this._threatOrigin = val;
    this.selectedControl = null;
  }
  @Input() public canEdit: boolean = true;
  public isShownInDialog: boolean = false;

  public selectedControl: Control;

  constructor(@Optional() origin: ThreatOrigin, @Optional() canEdit: MyBoolean, public theme: ThemeService, public dataService: DataService, private translate: TranslateService) { 
    if (origin) {
      this.threatOrigin = origin;
      this.isShownInDialog = true;
    }
    if (canEdit != null) {
      this.canEdit = canEdit.Value;
    }
  }

  ngOnInit(): void {
  }

  public GetThreatOriginTypes() {
    return ThreatOriginTypesUtil.GetTypes();
  }

  public GetThreatOriginTypeName(t: ThreatOriginTypes) {
    return ThreatOriginTypesUtil.ToString(t);
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

  public GetRootThreatOriginGroups(): ThreatOriginGroup[] {
    return this.dataService.Config.ThreatLibrary.SubGroups;
  }

  public GetThreatOriginGroup(): ThreatOriginGroup {
    return this.dataService.Config.FindGroupOfThreatOrigin(this.threatOrigin);
  }

  public GetThreatCategoryGroups(): ThreatCategoryGroup[] {
    return this.dataService.Config.GetThreatCategoryGroups().filter(x => x.ThreatCategories.length > 0);
  }

  public GetThreatRules(): ThreatRule[] {
    return this.dataService.Config.GetThreatRules().filter(x => x.ThreatOrigin?.ID == this.threatOrigin.ID);
  }

  public GetThreatRestriction(rule: ThreatRule): string {
    return RestrictionUtil.ToString(rule, this.dataService, this.translate);
  }

  public GetPossibleControls() {
    return this.dataService.Config.GetControls().filter(x => !x.MitigatedThreatOrigins.includes(this.threatOrigin));
  }

  public AddExistingControl(mit: Control) {
    mit.AddMitigatedThreatOrigin(this.threatOrigin);
  }

  public AddControl() {
    let mit = this.dataService.Config.CreateControl(this.dataService.Config.ControlLibrary);
    mit.AddMitigatedThreatOrigin(this.threatOrigin);
    this.selectedControl = mit;
  }

  public RemoveControl(mit: Control) {
    mit.RemoveMitigatedThreatOrigin(this.threatOrigin);
    if (mit == this.selectedControl) this.selectedControl = null;
  }

  public DeleteControl(mit: Control) {
    this.dataService.Config.DeleteControl(mit);
    if (mit == this.selectedControl) this.selectedControl = null;
  }

  public GetControls(): Control[] {
    return this.dataService.Config.GetControls().filter(x => x.MitigatedThreatOrigins.includes(this.threatOrigin));
  }

  public OnGroupChanged(event) {
    let group = this.dataService.Config.GetThreatOriginGroup(event.value);
    let curr = this.dataService.Config.FindGroupOfThreatOrigin(this.threatOrigin);
    if (curr) {
      curr.RemoveThreatOrigin(this.threatOrigin);
    }
    group.AddThreatOrigin(this.threatOrigin);
  }

  public dropControl(event: CdkDragDrop<string[]>, selectedArray) {
    const prev = this.dataService.Config.GetControls().indexOf(selectedArray[event.previousIndex]);
    const curr = this.dataService.Config.GetControls().indexOf(selectedArray[event.currentIndex]);
    moveItemInArray(this.dataService.Config.GetControls(), prev, curr);
  }
}
