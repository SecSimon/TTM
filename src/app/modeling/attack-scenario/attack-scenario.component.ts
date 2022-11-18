import { Component, EventEmitter, Input, OnInit, Optional } from '@angular/core';
import { LowMediumHighNumber, LowMediumHighNumberUtil } from '../../model/assets';
import { Countermeasure } from '../../model/mitigations';
import { RiskStrategies, RiskStrategyUtil, ThreatCategoryGroup, AttackScenario, ThreatOriginGroup, ThreatSeverities, ThreatSeverityUtil, ThreatStates, ThreatStateUtil } from '../../model/threat-model';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-attack-scenario',
  templateUrl: './attack-scenario.component.html',
  styleUrls: ['./attack-scenario.component.scss']
})
export class AttackScenarioComponent implements OnInit {
  private _threatRule: AttackScenario;

  public get attackScenario(): AttackScenario { return this._threatRule; }
  @Input() public set attackScenario(val: AttackScenario) { 
    this._threatRule = val;
    this.sysThreatGroups = null;
    if (val) {
      this.countermeasures = this.dataService.Project.GetCountermeasures().filter(x => x.AttackScenarios.includes(val));
    }
  }

  public countermeasures: Countermeasure[];

  @Input() canEdit: boolean = true;

  constructor(@Optional() mapping: AttackScenario, @Optional() onChange: EventEmitter<AttackScenario>, public theme: ThemeService, public dataService: DataService, private dialog: DialogService) {
    this.attackScenario = mapping;
    if (onChange) {
      onChange.subscribe(x => this.attackScenario = x);
    }
  }

  ngOnInit(): void {
  }

  public GetThreatOriginGroups(): ThreatOriginGroup[] {
    return this.dataService.Config.GetThreatOriginGroups().filter(x => x.ThreatOrigins.length > 0);
  }
  public GetThreatCategoryGroups(): ThreatCategoryGroup[] {
    return this.dataService.Config.GetThreatCategoryGroups().filter(x => x.ThreatCategories.length > 0);
  }

  private sysThreatGroups: any[];
  public GetSystemThreatGroups() {
    if (this.sysThreatGroups == null) {
      this.sysThreatGroups = [];
      let feat = { name: 'general.Highlighted', SystemThreats: [] };
      let all = { name: 'general.SystemThreats', SystemThreats: this.dataService.Project.GetSystemThreats() };
      feat.SystemThreats = all.SystemThreats.filter(x => this.attackScenario.ThreatCategories.includes(x.ThreatCategory));
      if (feat.SystemThreats.length > 0) this.sysThreatGroups.push(feat);
      this.sysThreatGroups.push(all);
    }

    return this.sysThreatGroups;
  }

  public GetTargetsNames(): string {
    if (this.attackScenario.Targets) return this.attackScenario.Targets.map(x => x.Name).join(', ');
  }

  public AddThreatOrigin() {
    let origin = this.dataService.Config.CreateThreatOrigin(null);
    this.dialog.OpenAddThreatOriginDialog(origin).subscribe(res => {
      if (res) {
        this.attackScenario.ThreatOrigin = origin;
      }
      else {
        this.dataService.Config.DeleteThreatOrigin(origin);
      }
    });
  }

  public CalculateRisk() {
    if (this.attackScenario.Severity != null && this.attackScenario.Likelihood != null) {
      let sev = 1;
      if (this.attackScenario.Severity == ThreatSeverities.High) sev = 0.8;
      else if (this.attackScenario.Severity == ThreatSeverities.Medium) sev = 0.5;
      else if (this.attackScenario.Severity == ThreatSeverities.Low) sev = 0.1;
      let like = 100;
      if (this.attackScenario.Likelihood == LowMediumHighNumber.Medium) like = 50;
      else if (this.attackScenario.Likelihood == LowMediumHighNumber.Low) like = 10;
      const val = sev * like;
      let risk = LowMediumHighNumber.Low;
      if (val >= 50) risk = LowMediumHighNumber.High;
      else if (val >= 10) risk = LowMediumHighNumber.Medium;
      this.attackScenario.Risk = risk;
    }
  }

  public GetThreatStates() {
    return ThreatStateUtil.GetThreatStates();
  }

  public GetThreatStateName(ts: ThreatStates) {
    return ThreatStateUtil.ToString(ts);
  }

  public GetSeverityTypes() {
    return ThreatSeverityUtil.GetTypes();
  }

  public GetSeverityTypeName(sev: ThreatSeverities) {
    return ThreatSeverityUtil.ToString(sev);
  }

  public GetLMHValues() {
    return LowMediumHighNumberUtil.GetKeys();
  }

  public GetLMHName(type: LowMediumHighNumber) {
    return LowMediumHighNumberUtil.ToString(type);
  }

  public GetRiskStrategies() {
    return RiskStrategyUtil.GetKeys();
  }

  public GetRiskStrategyName(type: RiskStrategies) {
    return RiskStrategyUtil.ToString(type);
  }
}
