import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Optional, ViewChild } from '@angular/core';
import { LowMediumHighNumber, LowMediumHighNumberUtil } from '../../model/assets';
import { Countermeasure } from '../../model/mitigations';
import { RiskStrategies, RiskStrategyUtil, ThreatCategoryGroup, AttackScenario, AttackVectorGroup, ThreatSeverities, ThreatSeverityUtil, ThreatStates, ThreatStateUtil, ICVSSEntry, IOwaspRREntry } from '../../model/threat-model';
import { CvssEntryComponent } from '../../shared/components/cvss-entry/cvss-entry.component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';
import { TestCase } from '../../model/test-case';
import { ThreatActor } from '../../model/threat-source';

@Component({
  selector: 'app-attack-scenario',
  templateUrl: './attack-scenario.component.html',
  styleUrls: ['./attack-scenario.component.scss']
})
export class AttackScenarioComponent implements OnInit {
  private _attackScenario: AttackScenario;
  private searchCounter = 0;
  private attackScenarioGroups: any[];
  private countermeasureGroups: any[];
  private attackVectorGroups: any[];
  private threatCategoryGroups: any[];
  private threatSources: ThreatActor[];
  public sysThreatGroups: any[];

  public get attackScenario(): AttackScenario { return this._attackScenario; }
  @Input() public set attackScenario(val: AttackScenario) { 
    this._attackScenario = val;
    if (val) {
      this.countermeasures = val.GetCountermeasures();
    }
    this.selectedCountermeasure = this.selectedLinkedScenario = this.selectedTestCase = null;
    this.sysThreatGroups = this.threatSources = this.threatCategoryGroups = this.attackVectorGroups = this.attackScenarioGroups = this.countermeasureGroups = null;
  }

  public countermeasures: Countermeasure[];
  public selectedCountermeasure: Countermeasure;
  public selectedLinkedScenario: AttackScenario;
  public selectedTestCase: TestCase;

  @Input() canEdit: boolean = true;

  @ViewChild('nameBox') public nameBox: ElementRef;

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

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (event.key == 'F2') {
      event.preventDefault();
      if (this.nameBox) {
        (this.nameBox.nativeElement as HTMLInputElement).select();
      }
    }
  }

  public GetAttackVectorGroups(): any[] {
    if (this.attackVectorGroups == null) {
      this.attackVectorGroups = [];
      this.dataService.Config.GetAttackVectorGroups().forEach(group => {
        if (group.AttackVectors.length > 0) {
          this.attackVectorGroups.push({ name: group.Name, AttackVectors: group.AttackVectors });
        }
      });
    }

    return this.attackVectorGroups; 
  }

  public OnSearchAttackVectors(event: KeyboardEvent) {
    this.searchCounter++;
    setTimeout(() => {
      this.searchCounter--;
      if (this.searchCounter == 0) {
        this.attackVectorGroups = null; // recreate groups
        this.GetAttackVectorGroups();
        const search = (event.target as HTMLInputElement).value.toLowerCase();
        const curr = this.attackScenario.AttackVector;
        this.attackVectorGroups.forEach(group => {
          group.AttackVectors = group.AttackVectors.filter(x => x == curr || x.Name.toLowerCase().includes(search));
        });
        this.attackVectorGroups = this.attackVectorGroups.filter(x => x.AttackVectors.length > 0);
      }
    }, 250);
  }

  public GetThreatCategoryGroups(): any[] {
    if (this.threatCategoryGroups == null) {
      this.threatCategoryGroups = [];
      this.dataService.Config.GetThreatCategoryGroups().forEach(group => {
        if (group.ThreatCategories.length > 0) {
          this.threatCategoryGroups.push({ name: group.Name, ThreatCategories: group.ThreatCategories });
        }
      });
    }

    return this.threatCategoryGroups;
  }

  public OnSearchThreatCategories(event: KeyboardEvent) {
    this.searchCounter++;
    setTimeout(() => {
      this.searchCounter--;
      if (this.searchCounter == 0) {
        this.threatCategoryGroups = null; // recreate groups
        this.GetThreatCategoryGroups();
        const search = (event.target as HTMLInputElement).value.toLowerCase();
        const curr = this.attackScenario.ThreatCategories;
        this.threatCategoryGroups.forEach(group => {
          group.ThreatCategories = group.ThreatCategories.filter(x => curr.includes(x) || x.Name.toLowerCase().includes(search));
        });
        this.threatCategoryGroups = this.threatCategoryGroups.filter(x => x.ThreatCategories.length > 0);
      }
    }, 250);
  }

  public GetSystemThreatGroups() {
    if (this.sysThreatGroups == null) {
      this.sysThreatGroups = [];
      const feat = { name: 'general.Highlighted', SystemThreats: this.dataService.Project.GetSystemThreats().filter(x => this.attackScenario.ThreatCategories.includes(x.ThreatCategory)) };
      const all = { name: 'general.SystemThreats', SystemThreats: this.dataService.Project.GetSystemThreats().filter(x => !feat.SystemThreats.includes(x)) };
      if (feat.SystemThreats.length > 0) this.sysThreatGroups.push(feat);
      this.sysThreatGroups.push(all);
    }

    return this.sysThreatGroups;
  }

  public OnSearchSystemThreat(event: KeyboardEvent) {
    this.searchCounter++;
    setTimeout(() => {
      this.searchCounter--;
      if (this.searchCounter == 0) {
        this.sysThreatGroups = null; // recreate groups
        this.GetSystemThreatGroups();
        const search = (event.target as HTMLInputElement).value.toLowerCase();
        const curr = this.attackScenario.SystemThreats;
        this.sysThreatGroups.forEach(group => {
          group.SystemThreats = group.SystemThreats.filter(x => curr.includes(x) || x.Name.toLowerCase().includes(search));
        });
        this.sysThreatGroups = this.sysThreatGroups.filter(x => x.SystemThreats.length > 0);
      }
    }, 250);
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

  public GetThreatSources() {
    if (this.threatSources == null) this.threatSources = this.dataService.Project.GetThreatSources().Sources;
    return this.threatSources;
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

  public OnSearchThreatSources(event: KeyboardEvent) {
    this.searchCounter++;
    setTimeout(() => {
      this.searchCounter--;
      if (this.searchCounter == 0) {
        this.threatSources = null;
        this.GetThreatSources();
        const search = (event.target as HTMLInputElement).value.toLowerCase();
        const curr = this.attackScenario.ThreatSources;
        this.threatSources = this.threatSources.filter(x => curr.includes(x) || x.Name.toLowerCase().includes(search));
      }
    }, 250);
  }

  public GetFilteredAttackScenarios() {
    return this.dataService.Project.GetAttackScenariosApplicable().filter(x => x.Name.toLowerCase().includes(this.searchASString.toLowerCase()) &&  x != this.attackScenario);
  }

  public GetFilteredLinkedAttackScenarios() {
    return this.dataService.Project.GetAttackScenariosApplicable().filter(x => x.Name.toLowerCase().includes(this.searchLinkedASString.toLowerCase()) &&  x != this.attackScenario && !this.attackScenario.LinkedScenarios.includes(x));
  }

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
    setTimeout(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'F2'}));
    }, 250);
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
