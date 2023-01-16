import { Component, EventEmitter, Input, OnInit, Optional } from '@angular/core';
import { LowMediumHighNumber, LowMediumHighNumberUtil } from '../../model/assets';
import { Countermeasure } from '../../model/mitigations';
import { RiskStrategies, RiskStrategyUtil, ThreatCategoryGroup, AttackScenario, AttackVectorGroup, ThreatSeverities, ThreatSeverityUtil, ThreatStates, ThreatStateUtil, ICVSSEntry, IOwaspRREntry } from '../../model/threat-model';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-attack-scenario',
  templateUrl: './attack-scenario.component.html',
  styleUrls: ['./attack-scenario.component.scss']
})
export class AttackScenarioComponent implements OnInit {
  private _attackScenario: AttackScenario;

  public get attackScenario(): AttackScenario { return this._attackScenario; }
  @Input() public set attackScenario(val: AttackScenario) { 
    this._attackScenario = val;
    this.sysThreatGroups = null;
    if (val) {
      this.countermeasures = val.GetCountermeasures();
    }
    this.selectedCountermeasure = null;
    this.selectedLinkedScenario = null;
  }

  public countermeasures: Countermeasure[];
  public selectedCountermeasure: Countermeasure;
  public selectedLinkedScenario: AttackScenario;

  @Input() canEdit: boolean = true;

  constructor(@Optional() mapping: AttackScenario, @Optional() onChange: EventEmitter<AttackScenario>, public theme: ThemeService, public dataService: DataService, private dialog: DialogService) {
    this.attackScenario = mapping;
    if (onChange) {
      onChange.subscribe(x => this.attackScenario = x);
    }
  }

  ngOnInit(): void {
  }

  public GetAttackVectorGroups(): AttackVectorGroup[] {
    return this.dataService.Config.GetAttackVectorGroups().filter(x => x.AttackVectors.length > 0);
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

  public AddAttackVector() {
    let vector = this.dataService.Config.CreateAttackVector(null);
    this.dialog.OpenAddAttackVectorDialog(vector).subscribe(res => {
      if (res) {
        this.attackScenario.AttackVector = vector;
      }
      else {
        this.dataService.Config.DeleteAttackVector(vector);
      }
    });
  }

  public AddMethodCVSS() {
    this.attackScenario.ScoreCVSS = {} as ICVSSEntry;
    this.EditMethodCVSS();
  }

  public EditMethodCVSS() {
    this.dialog.OpenCVSSEntryDiaglog(this.attackScenario.ScoreCVSS).subscribe(() => this.OnScoreCVSSChanged());
  }

  public RemoveMethodCVSS() {
    this.attackScenario.ScoreCVSS = null;
  }

  public AddMethodOwaspRR() {
    this.attackScenario.ScoreOwaspRR = {} as IOwaspRREntry;
    this.EditMethodOwaspRR();
  }

  public EditMethodOwaspRR() {
    this.dialog.OpenOwaspRREntryDiaglog(this.attackScenario.ScoreOwaspRR).subscribe(() => this.OnScoreOwaspRRChanged());
  }

  public RemoveMethodOwaspRR() {
    this.attackScenario.ScoreOwaspRR = null;
  }

  public OnScoreCVSSChanged() {
    if (this.attackScenario.ScoreCVSS.Score >= 9) this.attackScenario.Severity = ThreatSeverities.Critical;
    else if (this.attackScenario.ScoreCVSS.Score >= 7) this.attackScenario.Severity = ThreatSeverities.High;
    else if (this.attackScenario.ScoreCVSS.Score >= 4) this.attackScenario.Severity = ThreatSeverities.Medium;
    else if (this.attackScenario.ScoreCVSS.Score > 0) this.attackScenario.Severity = ThreatSeverities.Low;
    else this.attackScenario.Severity = ThreatSeverities.None;
    this.CalculateRisk();
  }

  public OnScoreOwaspRRChanged() {
    this.attackScenario.Severity = (this.attackScenario.ScoreOwaspRR.Impact as Number) as ThreatSeverities;
    this.attackScenario.Likelihood = this.attackScenario.ScoreOwaspRR.Likelihood;
    this.CalculateRisk();
  }

  public CalculateRisk() {
    if (this.attackScenario.Severity != null && this.attackScenario.Likelihood != null) {
      let sev = 1;
      if (this.attackScenario.Severity == ThreatSeverities.High) sev = 0.8;
      else if (this.attackScenario.Severity == ThreatSeverities.Medium) sev = 0.5;
      else if (this.attackScenario.Severity == ThreatSeverities.Low) sev = 0.1;
      else if (this.attackScenario.Severity == ThreatSeverities.None) sev = 0;
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

  private attackScenarioGroups: any[];
  public GetAttackScenarioGroups() {
    if (this.attackScenarioGroups == null) {
      this.attackScenarioGroups = [];
      const scenariosByView = this.dataService.Project.GetAttackScenariosApplicable().filter(x => x != this.attackScenario).reduce((ubc, u) => ({
        ...ubc,
        [u.ViewID]: [ ...(ubc[u.ViewID] || []), u ],
      }), {});
      Object.keys(scenariosByView).forEach(viewID => {
        this.attackScenarioGroups.push({ name: this.dataService.Project.GetView(viewID)?.Name, scenarios: scenariosByView[viewID] });
      });
      this.attackScenarioGroups.forEach(x => x['scenarios'].sort((a: AttackScenario, b: AttackScenario) => {
        return a.ThreatState > b.ThreatState ? -1 : (a.ThreatState == b.ThreatState ? 0 : 1);
      }));
    }

    return this.attackScenarioGroups;
  }

  public AdoptRiskValuesFrom(scenario: AttackScenario) {
    if (scenario.ScoreCVSS) this.attackScenario.ScoreCVSS = JSON.parse(JSON.stringify(scenario.ScoreCVSS));
    if (scenario.ScoreOwaspRR) this.attackScenario.ScoreOwaspRR = JSON.parse(JSON.stringify(scenario.ScoreOwaspRR));
    this.attackScenario.Severity = scenario.Severity;
    this.attackScenario.Likelihood = scenario.Likelihood;
    this.attackScenario.Risk = scenario.Risk;
    this.attackScenario.RiskStrategy = scenario.RiskStrategy;
    this.attackScenario.RiskStrategyReason = scenario.RiskStrategyReason;
    this.OnLinkScenario(scenario);
  }

  public GetRiskStrategies() {
    return RiskStrategyUtil.GetKeys();
  }

  public GetRiskStrategyName(type: RiskStrategies) {
    return RiskStrategyUtil.ToString(type);
  }

  public GetPossibleCountermeasures() {
    return this.dataService.Project.GetCountermeasuresApplicable().filter(x => !x.AttackScenarios.includes(this.attackScenario));
  }

  public AddExistingCountermeasure(cm: Countermeasure) {
    cm.AddAttackScenario(this.attackScenario);
    this.countermeasures = this.dataService.Project.GetCountermeasures().filter(x => x.AttackScenarios.includes(this.attackScenario));
  }

  public AddCountermeasure() {
    const cm = this.dataService.Project.CreateCountermeasure(this.attackScenario.ViewID, false);
    cm.SetMapping(null, this.attackScenario.Targets, [this.attackScenario])
    this.selectedCountermeasure = cm;
    this.countermeasures = this.dataService.Project.GetCountermeasures().filter(x => x.AttackScenarios.includes(this.attackScenario));
  }

  public RemoveCountermeasure(cm: Countermeasure) {
    cm.RemoveAttackScenario(this.attackScenario.ID);
    if (cm == this.selectedCountermeasure) this.selectedCountermeasure = null;
    this.countermeasures = this.dataService.Project.GetCountermeasures().filter(x => x.AttackScenarios.includes(this.attackScenario));
  }

  public DeleteCountermeasure(cm: Countermeasure) {
    this.dialog.OpenDeleteObjectDialog(cm).subscribe(res => {
      if (res) {
        this.dataService.Project.DeleteCountermeasure(cm); 
        if (cm == this.selectedCountermeasure) this.selectedCountermeasure = null;
        this.countermeasures = this.dataService.Project.GetCountermeasures().filter(x => x.AttackScenarios.includes(this.attackScenario));
      }
    });
  }

  public OnLinkScenario(scenario: AttackScenario) {
    this.attackScenario.AddLinkedAttackScenario(scenario);
    scenario.AddLinkedAttackScenario(this.attackScenario);
    this.selectedLinkedScenario = scenario;
  }

  public OnUnlinkScenario(scenario: AttackScenario) {
    this.attackScenario.RemoveLinkedAttackScenario(scenario.ID);
    scenario.RemoveLinkedAttackScenario(this.attackScenario.ID);
    if (this.selectedLinkedScenario == scenario) this.selectedLinkedScenario = null;
  }

  public EditAttackScenario(scenario: AttackScenario) {
    this.dialog.OpenAttackScenarioDialog(scenario, false, [this.attackScenario, ...this.attackScenario.LinkedScenarios]);
  }
}
