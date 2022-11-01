import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit, Optional } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IMitigationTip, Control } from '../../model/mitigations';
import { LifeCycle, LifeCycleUtil, RuleTypes, ThreatOriginGroup, ThreatRuleGroup } from '../../model/threat-model';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { StringExtension } from '../../util/string-extension';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.scss']
})
export class ControlComponent implements OnInit {
  private _control: Control;

  @Input() public node: INavigationNode;
  public get control(): Control { return this._control; }
  @Input() public set control(val: Control) { 
    this._control = val;
    this.threatOriginGroups = null;
    this.selectedMitigationTip = null;
  }
  @Input() public canEdit: boolean = true;
  @Input() public canEditName: boolean = false;
  @Input() public canEditGroup: boolean = false;

  public selectedMitigationTip: IMitigationTip;

  constructor(@Optional() control: Control, public theme: ThemeService, public dataService: DataService, private dialog: DialogService, private translate: TranslateService) { 
    if (control) {
      this.control = control;
      this.canEdit = false;
    }
  }

  ngOnInit(): void {
  }

  private threatOriginGroups = null;
  public GetAvailableThreatOriginGroups() {
    if (this.threatOriginGroups != null) return this.threatOriginGroups;

    this.threatOriginGroups = [];
    let pushSubGroups = (group: ThreatOriginGroup) => {
      if (group.ThreatOrigins?.length > 0) {
        this.threatOriginGroups.push({ Name: group.Name, ThreatOrigins: group.ThreatOrigins });
      }
      if (group.SubGroups?.length > 0) {
        group.SubGroups.forEach(x => pushSubGroups(x));
      }
    };
    pushSubGroups(this.dataService.Config.ThreatLibrary);

    return this.threatOriginGroups;
  }

  private threatRuleGroups = null;
  public GetAvailableThreatRuleGroups() {
    if (this.threatRuleGroups != null) return this.threatRuleGroups;

    this.threatRuleGroups = [];
    let pushSubGroups = (group: ThreatRuleGroup) => {
      if (group.ThreatRules?.length > 0) {
        this.threatRuleGroups.push({ Name: group.Name, ThreatRules: group.ThreatRules });
      }
      if (group.SubGroups?.length > 0) {
        group.SubGroups.forEach(x => pushSubGroups(x));
      }
    };
    this.dataService.Config.GetThreatRuleGroups().forEach(x => pushSubGroups(x));

    return this.threatRuleGroups;
  }

  public GetControlGroups() {
    return this.dataService.Config.GetControlGroups();
  }

  public GetControlGroup() {
    return this.dataService.Config.FindGroupOfControl(this.control);
  }

  public OnControlGroupChanged(event) {
    let curr = this.dataService.Config.FindGroupOfControl(this.control);
    if (curr) {
      curr.RemoveControl(this.control);
    }
    event.value.AddControl(this.control);
  }

  public AddTip() {
    this.control.MitigationTips.push({ Name: StringExtension.FindUniqueName('Tip', this.control.MitigationTips.map(x => x.Name)), Description: '', LifeCycles: [] });
    this.selectedMitigationTip = this.control.MitigationTips[this.control.MitigationTips.length-1];
  }

  public DeleteTip(tip: IMitigationTip) {
    const index = this.control.MitigationTips.indexOf(tip);
    if (index >= 0) {
      this.control.MitigationTips.splice(index, 1);
      if (tip == this.selectedMitigationTip) this.selectedMitigationTip = null;
    }
  }  
  
  public drop(event: CdkDragDrop<string[]>, selectedArray) {
    moveItemInArray(selectedArray, event.previousIndex, event.currentIndex);
  }

  public ContainsLifeCycle(lc: LifeCycle) {
    return this.selectedMitigationTip.LifeCycles.includes(lc);
  }

  public SetLifeCycle(lc, event) {
    if (event.checked) this.selectedMitigationTip.LifeCycles.push(lc);
    else this.selectedMitigationTip.LifeCycles.splice(this.selectedMitigationTip.LifeCycles.findIndex(x => x == lc), 1);
  }

  public GetLifeCycleNames(tip: IMitigationTip) {
    if (tip.LifeCycles.length == 0) return '-';
    return tip.LifeCycles.map(x => this.translate.instant(this.GetLifeCycleName(x))).join(', ');
  }

  public GetLifeCycles() {
    return LifeCycleUtil.GetMitigationKeys();
  }

  public GetLifeCycleName(lc: LifeCycle) {
    return LifeCycleUtil.ToString(lc);
  }
}
