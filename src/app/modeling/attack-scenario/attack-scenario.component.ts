import { Component, ElementRef, EventEmitter, Input, OnInit, Optional, ViewChild } from '@angular/core';
import { LowMediumHighNumber, LowMediumHighNumberUtil } from '../../model/assets';
import { Countermeasure } from '../../model/mitigations';
import { RiskStrategies, RiskStrategyUtil, ThreatCategoryGroup, AttackScenario, AttackVectorGroup, ThreatSeverities, ThreatSeverityUtil, ThreatStates, ThreatStateUtil, ICVSSEntry, IOwaspRREntry } from '../../model/threat-model';
import { CvssEntryComponent } from '../../shared/components/cvss-entry/cvss-entry.component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';
import { TestCase } from '../../model/test-case';

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
    if (val) {
      this.countermeasures = val.GetCountermeasures();
    }
    this.sysThreatGroups = this.selectedCountermeasure = this.selectedLinkedScenario = this.selectedTestCase = null;
    this.attackScenarioGroups = this.countermeasureGroups = null;
  }

  public countermeasures: Countermeasure[];
  public selectedCountermeasure: Countermeasure;
  public selectedLinkedScenario: AttackScenario;
  public selectedTestCase: TestCase;

  @Input() canEdit: boolean = true;

  @ViewChild('searchASBox', { static: false }) public searchASBox: any;
  public searchASString: string = '';
  @ViewChild('searchLinkedASBox', { static: false }) public searchLinkedASBox: any;
  public searchLinkedASString: string = '';
  @ViewChild('searchCMBox', { static: false }) public searchCMBox: any;
  public searchCMString: string = '';
  @ViewChild('searchTCBox', { static: false }) public searchTCBox: any;
  public searchTCString: string = '';

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
    this.attackScenario.Severity = CvssEntryComponent.ToThreatSeverity(this.attackScenario.ScoreCVSS.Score);
    this.attackScenario.CalculateRisk();
  }

  public OnScoreOwaspRRChanged() {
    this.attackScenario.Severity = (this.attackScenario.ScoreOwaspRR.Impact as Number) as ThreatSeverities;
    this.attackScenario.Likelihood = this.attackScenario.ScoreOwaspRR.Likelihood;
    this.attackScenario.CalculateRisk();
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

  public ThreatSourcesAll(): boolean {
    return this.attackScenario.ThreatSources.length == this.dataService.Project.GetThreatSources().Sources.length;
  }

  public ThreatSourcesSome(): boolean {
    return this.attackScenario.ThreatSources.length > 0 && !this.ThreatSourcesAll();
  }

  public ThreatSourcesLabel(): string {
    if (this.ThreatSourcesAll()) return 'pages.modeling.attackscenario.threatSourcesNone';
    return 'pages.modeling.attackscenario.threatSourcesAll';
  }

  public ThreatSourcesUpdate(checked: boolean) {
    if (checked) this.attackScenario.ThreatSources = this.dataService.Project.GetThreatSources().Sources;
    else this.attackScenario.ThreatSources = [];
  }

  public GetFilteredAttackScenarios() {
    return this.dataService.Project.GetAttackScenariosApplicable().filter(x => x.Name.toLowerCase().includes(this.searchASString.toLowerCase()) &&  x != this.attackScenario);
  }

  public GetFilteredLinkedAttackScenarios() {
    return this.dataService.Project.GetAttackScenariosApplicable().filter(x => x.Name.toLowerCase().includes(this.searchLinkedASString.toLowerCase()) &&  x != this.attackScenario && !this.attackScenario.LinkedScenarios.includes(x));
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
    this.attackScenario.SeverityReason = scenario.SeverityReason;
    this.attackScenario.Likelihood = scenario.Likelihood;
    this.attackScenario.LikelihoodReason = scenario.LikelihoodReason;
    this.attackScenario.Risk = scenario.Risk;
    this.attackScenario.RiskReason = scenario.RiskReason;
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

  public GetFilteredCountermeasures() {
    return this.dataService.Project.GetCountermeasuresApplicable().filter(x => x.Name.toLowerCase().includes(this.searchCMString.toLowerCase()) && !x.AttackScenarios.includes(this.attackScenario));
  }

  private countermeasureGroups: any[];
  public GetCountermeasureGroups() {
    if (this.countermeasureGroups == null) {
      this.countermeasureGroups = [];
      const cmsByView = this.dataService.Project.GetCountermeasuresApplicable().filter(x => !this.countermeasures.includes(x)).reduce((ubc, u) => ({
        ...ubc,
        [u.ViewID]: [ ...(ubc[u.ViewID] || []), u ],
      }), {});
      Object.keys(cmsByView).forEach(viewID => {
        this.countermeasureGroups.push({ name: this.dataService.Project.GetView(viewID)?.Name, countermeasures: cmsByView[viewID] });
      });
      this.countermeasureGroups.forEach(x => x['countermeasures'].sort((a: Countermeasure, b: Countermeasure) => {
        return a.MitigationState > b.MitigationState ? -1 : (a.MitigationState == b.MitigationState ? 0 : 1);
      }));
    }

    return this.countermeasureGroups;
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

  public GetTestCases() {
    return this.dataService.Project.GetTesting().TestCases.filter(x => !this.attackScenario.GetTestCases().includes(x));
  }

  public GetFilteredTestCases() {
    return this.GetTestCases().filter(x => x.Name.toLowerCase().includes(this.searchTCString.toLowerCase()));
  }

  public OnLinkTestCase(tc: TestCase) {
    tc.AddLinkedAttackScenario(this.attackScenario);
    this.selectedTestCase = tc;
  }

  public OnUnlinkTestCase(tc: TestCase) {
    tc.RemoveLinkedAttackScenario(this.attackScenario.ID);
    if (this.selectedTestCase == tc) this.selectedTestCase = null;
  }

  public GetSystemThreatsWidth() {
    return this.dataService.Project.Settings.ThreatActorToAttackScenario ? '315px' : '0px';
  }

  public NumberAlreadyExists() {
    return this.dataService.Project.GetAttackScenarios().some(x => x.Number == this.attackScenario.Number && x.ID != this.attackScenario.ID);
  }

  public OnSearchASBoxClick() {
    this.searchASBox?._elementRef?.nativeElement?.focus();
  }

  public OnSearchLinkedASBoxClick() {
    this.searchLinkedASBox?._elementRef?.nativeElement?.focus();
  }

  public OnSearchCMBoxClick() {
    this.searchCMBox?._elementRef?.nativeElement?.focus();
  }

  public OnSearchTCBoxClick() {
    this.searchTCBox?._elementRef?.nativeElement?.focus();
  }
}
