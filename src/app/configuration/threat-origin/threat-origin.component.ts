import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit, Optional } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Mitigation } from '../../model/mitigations';
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
    this.selectedMitigation = null;
  }
  @Input() public canEdit: boolean = true;
  public isShownInDialog: boolean = false;

  public selectedMitigation: Mitigation;

  constructor(@Optional() origin: ThreatOrigin, @Optional() canEdit: MyBoolean, public theme: ThemeService, private dataService: DataService, private translate: TranslateService) { 
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

  public GetPossibleMitigations() {
    return this.dataService.Config.GetMitigations().filter(x => !x.MitigatedThreatOrigins.includes(this.threatOrigin));
  }

  public AddExistingMitigation(mit: Mitigation) {
    mit.AddMitigatedThreatOrigin(this.threatOrigin);
  }

  public AddMitigation() {
    let mit = this.dataService.Config.CreateMitigation(this.dataService.Config.MitigationLibrary);
    mit.AddMitigatedThreatOrigin(this.threatOrigin);
    this.selectedMitigation = mit;
  }

  public RemoveMitigation(mit: Mitigation) {
    mit.RemoveMitigatedThreatOrigin(this.threatOrigin);
    if (mit == this.selectedMitigation) this.selectedMitigation = null;
  }

  public DeleteMitigation(mit: Mitigation) {
    this.dataService.Config.DeleteMitigation(mit);
    if (mit == this.selectedMitigation) this.selectedMitigation = null;
  }

  public GetMitigations(): Mitigation[] {
    return this.dataService.Config.GetMitigations().filter(x => x.MitigatedThreatOrigins.includes(this.threatOrigin));
  }

  public OnGroupChanged(event) {
    let group = this.dataService.Config.GetThreatOriginGroup(event.value);
    let curr = this.dataService.Config.FindGroupOfThreatOrigin(this.threatOrigin);
    if (curr) {
      curr.RemoveThreatOrigin(this.threatOrigin);
    }
    group.AddThreatOrigin(this.threatOrigin);
  }

  public dropMitigation(event: CdkDragDrop<string[]>, selectedArray) {
    const prev = this.dataService.Config.GetMitigations().indexOf(selectedArray[event.previousIndex]);
    const curr = this.dataService.Config.GetMitigations().indexOf(selectedArray[event.currentIndex]);
    moveItemInArray(this.dataService.Config.GetMitigations(), prev, curr);
  }
}
