import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { Diagram, DiagramTypes } from '../../model/diagram';
import { Countermeasure, MitigationStates, MitigationStateUtil } from '../../model/mitigations';
import { AttackScenario, ThreatStates, MappingStates, ThreatSeverityUtil, LifeCycleUtil, ThreatStateUtil, ThreatSeverities, ImpactCategoryUtil } from '../../model/threat-model';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { LocalStorageService, LocStorageKeys } from '../../util/local-storage.service';

import { LowMediumHighNumberUtil, LowMediumHighNumber } from '../../model/assets';
import { ThemeService } from '../../util/theme.service';
import { ProjectFile } from '../../model/project-file';
import { MyTagChart, TagChartTypes } from '../../model/my-tags';
import { MyComponentTypeIDs } from '../../model/component';

enum DiaColors {
  Black = '#000000',
  White = '#FFFFFF',
  Green = '#339900',
  Yellow = '#FFCC00',
  Red = '#FF2417',
  DarkRed = '#8a0f0f'
}

export interface IDiagramData {
  results: any[];
  scheme: any;
  view: [number, number];
  xAxisLabel: string;
  yAxisLabel: string;
}

export interface ISerie {
  name: string;
  value: number;
}

export interface IStackedSeries {
  name: string;
  series: ISerie[];
}

@Component({
  selector: 'app-results-analysis',
  templateUrl: './results-analysis.component.html',
  styleUrls: ['./results-analysis.component.scss']
})
export class ResultsAnalysisComponent implements AfterViewInit {
  private updateDiagramsDelayCounter = 0;
  public get isUpdatingDiagrams(): boolean { return this.updateDiagramsDelayCounter > 0; }
  private _attackScenarios: AttackScenario[] = [];
  private _selectedThreats: AttackScenario[] = [];
  private _countermeasures: Countermeasure[] = [];
  private _selectedCountermeasures: Countermeasure[] = [];

  public menuTopLeftPosition =  {x: '0', y: '0'};
  public get isBlueColorScheme(): boolean {
    let res = this.locStorage.Get(LocStorageKeys.PAGE_DASHBOARD_COLOR_SCHEME);
    return res == 'true';
  };
  public set isBlueColorScheme(val: boolean) {
    this.locStorage.Set(LocStorageKeys.PAGE_DASHBOARD_COLOR_SCHEME, String(val));
  }
  @ViewChild(MatMenuTrigger) public matMenuTrigger: MatMenuTrigger; 
  @ViewChild('threattable') sortThreats: MatSort;
  @ViewChild('countermeasuretable') sortCountermeasures: MatSort;

  public diagrams: IDiagramData[] = [];

  public displayedThreatColumns = ['number', 'name', 'elements', 'view', 'severity', 'risk', 'status'];
  public dataSourceThreats: MatTableDataSource<AttackScenario>;
  public displayedCountermeasureColumns = ['number', 'name', 'targets', 'view', 'progress', 'status'];
  public dataSourceCountermeasures: MatTableDataSource<Countermeasure>;

  public get AttackScenarios(): AttackScenario[] { return this._attackScenarios; }
  public set AttackScenarios(val: AttackScenario[]) {
    this._attackScenarios = val;
    let mySort = (data: AttackScenario, sortHeaderId: string) => {
      if (sortHeaderId == 'number') return Number(data.Number);
      if (sortHeaderId == 'name') return data.Name;
      if (sortHeaderId == 'elements') return this.GetTargets(data);
      if (sortHeaderId == 'view') return this.GetViewName(data);
      if (sortHeaderId == 'severity') return data.Severity;
      if (sortHeaderId == 'risk') return data.Risk;
      if (sortHeaderId == 'status') return data.ThreatState; 
      console.error('Missing sorting header', sortHeaderId); 
    };
    let myFilter = (data: AttackScenario, filter: string) => {
      let search = filter.trim().toLowerCase();
      let res = data.Name.toLowerCase().indexOf(search);
      if (res == -1) res = data.AttackVector?.Name.toLowerCase().indexOf(search);
      if (res == -1) res = this.GetTargets(data)?.toLowerCase().indexOf(search); 
      return (res != null && res != -1);
    };

    this.dataSourceThreats = new MatTableDataSource(val.filter(x => ![ThreatStates.NotApplicable, ThreatStates.Duplicate].includes(x.ThreatState)));
    this.dataSourceThreats.sort = this.sortThreats;
    this.dataSourceThreats.sortingDataAccessor = mySort;
    this.dataSourceThreats.filterPredicate = myFilter;

    if (this.sortThreats) this.sortThreats.sortChange.emit(this.sortThreats);
  }
  public get selectedThreats(): AttackScenario[] { return this._selectedThreats; }
  public set selectedThreats(val: AttackScenario[]) {
    if (val.length == this._selectedThreats.length) {
      if (val.every(x => this._selectedThreats.some(y => y.ID == x.ID))) return;
    }
    this._selectedThreats = val;

    if (val.length == 1) {
      this.selectedCountermeasures = this.Countermeasures.filter(x => x.AttackScenarios.includes(val[0]));
    }
  }

  public get Countermeasures(): Countermeasure[] { return this._countermeasures; }
  public set Countermeasures(val: Countermeasure[]) {
    this._countermeasures = val;
    let mySort = (data: Countermeasure, sortHeaderId: string) => {
      if (sortHeaderId == 'number') return Number(data.Number);
      if (sortHeaderId == 'name') return data.Name;
      if (sortHeaderId == 'targets') return this.GetTargets(data);
      if (sortHeaderId == 'view') return this.GetViewName(data);
      if (sortHeaderId == 'status') return data.MitigationState; 
      console.error('Missing sorting header', sortHeaderId); 
    };
    let myFilter = (data: Countermeasure, filter: string) => {
      let search = filter.trim().toLowerCase();
      let res = data.Name.toLowerCase().indexOf(search);
      if (res == -1) res = data.Control?.Name.toLowerCase().indexOf(search);
      if (res == -1) res = this.GetTargets(data)?.toLowerCase().indexOf(search);
      return (res != null && res != -1);
    };

    this.dataSourceCountermeasures = new MatTableDataSource(val.filter(x => ![MitigationStates.NotApplicable, MitigationStates.Rejected, MitigationStates.Duplicate].includes(x.MitigationState)));
    this.dataSourceCountermeasures.sort = this.sortCountermeasures;
    this.dataSourceCountermeasures.sortingDataAccessor = mySort;
    this.dataSourceCountermeasures.filterPredicate = myFilter;

    if (this.sortCountermeasures) this.sortCountermeasures.sortChange.emit(this.sortCountermeasures);
  }
  public get selectedCountermeasures(): Countermeasure[] { return this._selectedCountermeasures; }
  public set selectedCountermeasures(val: Countermeasure[]) {
    if (val.length == this._selectedCountermeasures.length) {
      if (val.every(x => this._selectedCountermeasures.some(y => y.ID == x.ID))) return;
    }
    this._selectedCountermeasures = val;

    if (val.length == 1) {
      this.selectedThreats = this.AttackScenarios.filter(x => val[0].AttackScenarios.includes(x));
    }
  }

  constructor(public theme: ThemeService, public dataService: DataService, public dialog: DialogService, private translate: TranslateService, private locStorage: LocalStorageService, public elRef: ElementRef) { }

  ngAfterViewInit(): void {
    let setData = () => {
      setTimeout(() => {
        this.AttackScenarios = this.dataService.Project.GetAttackScenariosApplicable().filter(x => x.MappingState != MappingStates.Removed);
        this.Countermeasures = this.dataService.Project.GetCountermeasuresApplicable().filter(x => x.MappingState != MappingStates.Removed);
      
        this.UpdateDiagrams();
      }, 10);
    };
    
    if (this.dataService.Project) setData();
    else this.dataService.ProjectChanged.subscribe(x => setData());
    this.theme.ThemeChanged.subscribe(x => {
      setTimeout(() => {
        this.UpdateDiagrams();
      }, 100);
    });
  }

  public UpdateDiagrams() {
    if (!this.dataService.Project) return;
    let hei = (window.innerHeight - 24) * this.GetSplitSize(1, 0, 50) / 100;
    hei = hei - 36 - 17 - 20 - 33 - 60; // h2, h4, margin?, legend, margin
    let wid = (document.getElementById('diagramContainer').clientWidth - 20 - 3*10) / 4;

    let dia1 = ResultsAnalysisComponent.CreateSeveritySummaryDiagram(this.dataService.Project, this.translate, this.theme.IsDarkMode, this.isBlueColorScheme, wid, hei);
    let dia3 = ResultsAnalysisComponent.CreateCountermeasureSummaryDiagram(this.dataService.Project, this.translate, this.theme.IsDarkMode, this.isBlueColorScheme, wid, hei);
    let dia5 = ResultsAnalysisComponent.CreateSeverityPerLifecycleDiagram(this.dataService.Project, this.translate, this.theme.IsDarkMode, this.isBlueColorScheme, wid, hei);
    let dia4 = ResultsAnalysisComponent.CreateSeverityPerTypeDiagram(this.dataService.Project, this.translate, this.theme.IsDarkMode, this.isBlueColorScheme, wid, hei);
    let dia2 = ResultsAnalysisComponent.CreateRiskSummaryDiagram(this.dataService.Project, this.translate, this.theme.IsDarkMode, this.isBlueColorScheme, wid, hei);
    let dia6 = ResultsAnalysisComponent.CreateSeverityPerImpactCatDiagram(this.dataService.Project, this.translate, this.theme.IsDarkMode, this.isBlueColorScheme, wid, hei);

    let res = [];
    this.dataService.Project.GetMyTagCharts().forEach(x => {
      res.push(ResultsAnalysisComponent.CreateTagDiagram(this.dataService.Project, this.translate, this.theme.IsDarkMode, this.isBlueColorScheme, wid, hei, x));
    });
    this.diagrams = [...res, dia1, dia2, dia3, dia4, dia5, dia6];
  }

  public UpdateDiagramsDelayed() {
    this.updateDiagramsDelayCounter++;
    setTimeout(() => {
      this.updateDiagramsDelayCounter--;
      if (this.updateDiagramsDelayCounter == 0) this.UpdateDiagrams();
    }, 3000);
  }

  public static CreateTagDiagram(pf: ProjectFile, translate: TranslateService, isDarkmode: boolean, isBlueColorScheme: boolean, wid, hei, chart: MyTagChart): IDiagramData {
    let diagramValues: IStackedSeries[] = [];

    let getServeritySeries = (scenarios: AttackScenario[]): ISerie[] => {
      let res: ISerie[] = [];
      res.push({ name: translate.instant('properties.threatstate.NotSet'), value: scenarios.filter(x => !ThreatSeverityUtil.GetTypesDashboard().includes(x.Severity)).length });
      ThreatSeverityUtil.GetTypesDashboard().forEach(sev => {
        res.push({ name: translate.instant(ThreatSeverityUtil.ToString(sev)), value: scenarios.filter(x => x.Severity == sev).length });
      });
      return res;
    };
    let getRiskSeries = (scenarios: AttackScenario[]): ISerie[] => {
      let res: ISerie[] = [];
      res.push({ name: translate.instant('properties.threatstate.NotSet'), value: scenarios.filter(x => x.Risk == null).length });
      ThreatSeverityUtil.GetTypesDashboard().forEach(risk => {
        res.push({ name: translate.instant(ThreatSeverityUtil.ToString(risk)), value: scenarios.filter(x => x.Risk == risk).length });
      });
      return res;
    };
    let getCountermeasureSeries = (mappings: Countermeasure[]): ISerie[] => {
      let res: ISerie[] = [];
      MitigationStateUtil.GetMitigationStates().filter(x => x != MitigationStates.NotApplicable).forEach(state => {
        res.push({ name: translate.instant(MitigationStateUtil.ToString(state)), value: mappings.filter(x => x.MitigationState == state).length });
      });
      return res;
    };

    chart.MyTags.forEach(tag => {
      let series: ISerie[];
      if (chart.Type == TagChartTypes.Severity) series = getServeritySeries(pf.GetAttackScenariosApplicable().filter(x => x.MyTags.includes(tag)));
      else if (chart.Type == TagChartTypes.Risk) series = getRiskSeries(pf.GetAttackScenariosApplicable().filter(x => x.MyTags.includes(tag)));
      else series = getCountermeasureSeries(pf.GetCountermeasuresApplicable().filter(x => x.MyTags.includes(tag)));
      let data: IStackedSeries = {
        name: tag.GetProperty('Name'),
        series: series
      };
      diagramValues.push(data);
    });

    diagramValues = diagramValues.filter(x => !x.series.every(y => y.value == 0));

    let schema = [ResultsAnalysisComponent.getNeutral(isDarkmode), DiaColors.Green, DiaColors.Yellow, DiaColors.Red, DiaColors.DarkRed];
    if (chart.Type == TagChartTypes.Countermeasure) schema = [DiaColors.DarkRed, ResultsAnalysisComponent.getNeutral(isDarkmode), DiaColors.Red, DiaColors.Yellow, DiaColors.Green];

    let dia: IDiagramData = {
      results: diagramValues,
      view: [wid, hei],
      scheme: isBlueColorScheme ? 'air' : { domain: schema },
      xAxisLabel: chart.Name,
      yAxisLabel: translate.instant('pages.dashboard.NumberOfThreats')
    };
    return dia;
  }

  public static CreateSeveritySummaryDiagram(pf: ProjectFile, translate: TranslateService, isDarkmode: boolean, isBlueColorScheme: boolean, wid, hei): IDiagramData {
    let diagramValues: IStackedSeries[] = [];
    let allAttackScenarios = pf.GetAttackScenariosApplicable();
    let getSeries = (mappings: AttackScenario[]): ISerie[] => {
      let res: ISerie[] = [];
      allAttackScenarios = allAttackScenarios.filter(x => !mappings.includes(x));
      res.push({ name: translate.instant('properties.threatstate.NotSet'), value: mappings.filter(x => !ThreatSeverityUtil.GetTypesDashboard().includes(x.Severity)).length });
      ThreatSeverityUtil.GetTypesDashboard().forEach(sev => {
        res.push({ name: translate.instant(ThreatSeverityUtil.ToString(sev)), value: mappings.filter(x => x.Severity == sev).length });
      });
      return res;
    };

    pf.GetDevices().forEach(dev => {
      let data: IStackedSeries = {
        name: dev.GetProperty('Name'),
        series: getSeries(dev.GetAttackScenariosApplicable())
      };
      diagramValues.push(data);
    });
    pf.GetMobileApps().forEach(app => {
      let data: IStackedSeries = {
        name: app.GetProperty('Name'),
        series: getSeries(app.GetAttackScenariosApplicable())
      };
      diagramValues.push(data);
    });
    pf.GetDFDiagrams().forEach(dfd => {
      let data: IStackedSeries = {
        name: dfd.GetProperty('Name'),
        series: getSeries(pf.GetAttackScenariosApplicable().filter(x => x.ViewID == dfd.ID))
      };
      diagramValues.push(data);
    });

    if (allAttackScenarios.length > 0) {
      let data: IStackedSeries = {
        name: translate.instant('general.Other'),
        series: getSeries(allAttackScenarios)
      };
      diagramValues.push(data);
    }

    diagramValues = diagramValues.filter(x => !x.series.every(y => y.value == 0));

    let dia: IDiagramData = {
      results: diagramValues,
      view: [wid, hei],
      scheme: isBlueColorScheme ? 'air' : { domain: [ResultsAnalysisComponent.getNeutral(isDarkmode), DiaColors.Green, DiaColors.Yellow, DiaColors.Red, DiaColors.DarkRed] },
      xAxisLabel: translate.instant('pages.dashboard.SeverityOverview'),
      yAxisLabel: translate.instant('pages.dashboard.NumberOfThreats')
    };
    return dia;
  }

  public static CreateRiskSummaryDiagram(pf: ProjectFile, translate: TranslateService, isDarkmode: boolean, isBlueColorScheme: boolean, wid, hei): IDiagramData {
    let diagramValues: IStackedSeries[] = [];
    let allAttackScenarios = pf.GetAttackScenariosApplicable();
    let getSeries = (scenarios: AttackScenario[]): ISerie[] => {
      let res: ISerie[] = [];
      allAttackScenarios = allAttackScenarios.filter(x => !scenarios.includes(x));
      res.push({ name: translate.instant('properties.threatstate.NotSet'), value: scenarios.filter(x => x.Risk == null).length });
      ThreatSeverityUtil.GetTypesDashboard().forEach(risk => {
        res.push({ name: translate.instant(ThreatSeverityUtil.ToString(risk)), value: scenarios.filter(x => x.Risk == risk).length });
      });
      return res;
    };

    pf.GetDevices().forEach(dev => {
      let data: IStackedSeries = {
        name: dev.GetProperty('Name'),
        series: getSeries(dev.GetAttackScenariosApplicable())
      };
      diagramValues.push(data);
    });
    pf.GetMobileApps().forEach(app => {
      let data: IStackedSeries = {
        name: app.GetProperty('Name'),
        series: getSeries(app.GetAttackScenariosApplicable())
      };
      diagramValues.push(data);
    });
    pf.GetDFDiagrams().forEach(dfd => {
      let data: IStackedSeries = {
        name: dfd.GetProperty('Name'),
        series: getSeries(pf.GetAttackScenariosApplicable().filter(x => x.ViewID == dfd.ID))
      };
      diagramValues.push(data);
    });

    if (allAttackScenarios.length > 0) {
      let data: IStackedSeries = {
        name: translate.instant('general.Other'),
        series: getSeries(allAttackScenarios)
      };
      diagramValues.push(data);
    }

    diagramValues = diagramValues.filter(x => !x.series.every(y => y.value == 0));

    let dia: IDiagramData = {
      results: diagramValues,
      view: [wid, hei],
      scheme: isBlueColorScheme ? 'air' : { domain: [ResultsAnalysisComponent.getNeutral(isDarkmode), DiaColors.Green, DiaColors.Yellow, DiaColors.Red, DiaColors.DarkRed] },
      xAxisLabel: translate.instant('pages.dashboard.RiskOverview'),
      yAxisLabel: translate.instant('pages.dashboard.NumberOfThreats')
    };
    return dia;
  }

  public static CreateCountermeasureSummaryDiagram(pf: ProjectFile, translate: TranslateService, isDarkmode: boolean, isBlueColorScheme: boolean, wid, hei): IDiagramData {
    let diagramValues: IStackedSeries[] = [];
    let allCountermeasures = pf.GetCountermeasuresApplicable();
    let getSeries = (mappings: Countermeasure[]): ISerie[] => {
      let res: ISerie[] = [];
      allCountermeasures = allCountermeasures.filter(x => !mappings.includes(x));
      MitigationStateUtil.GetDashboardMitigationStates().forEach(state => {
        res.push({ name: translate.instant(MitigationStateUtil.ToString(state)), value: mappings.filter(x => x.MitigationState == state).length });
      });
      return res;
    };

    pf.GetDevices().forEach(dev => {
      let data: IStackedSeries = {
        name: dev.GetProperty('Name'),
        series: getSeries(dev.GetCountermeasuresApplicable())
      };
      diagramValues.push(data);
    });
    pf.GetMobileApps().forEach(app => {
      let data: IStackedSeries = {
        name: app.GetProperty('Name'),
        series: getSeries(app.GetCountermeasuresApplicable())
      };
      diagramValues.push(data);
    });
    pf.GetDFDiagrams().forEach(dfd => {
      let data: IStackedSeries = {
        name: dfd.GetProperty('Name'),
        series: getSeries(pf.GetCountermeasuresApplicable().filter(x => x.ViewID == dfd.ID))
      };
      diagramValues.push(data);
    });

    if (allCountermeasures.length > 0) {
      let data: IStackedSeries = {
        name: translate.instant('general.Other'),
        series: getSeries(allCountermeasures)
      };
      diagramValues.push(data);
    }

    diagramValues = diagramValues.filter(x => !x.series.every(y => y.value == 0));

    let dia: IDiagramData = {
      results: diagramValues,
      view: [wid, hei],
      scheme: isBlueColorScheme ? 'air' : { domain: [DiaColors.DarkRed, DiaColors.Red, DiaColors.Yellow, DiaColors.Green] },
      xAxisLabel: translate.instant('pages.dashboard.MeasureOverview'),
      yAxisLabel: translate.instant('pages.dashboard.NumberOfCountermeasures')
    };
    return dia;
  }

  public static CreateSeverityPerLifecycleDiagram(pf: ProjectFile, translate: TranslateService, isDarkmode: boolean, isBlueColorScheme: boolean, wid, hei): IDiagramData {
    let diagramValues: IStackedSeries[] = [];
    let allAttackScenarios = pf.GetAttackScenariosApplicable();
    let getSeries = (mappings: AttackScenario[]): ISerie[] => {
      let res: ISerie[] = [];
      allAttackScenarios = allAttackScenarios.filter(x => !mappings.includes(x));
      res.push({ name: translate.instant('properties.threatstate.NotSet'), value: mappings.filter(x => !ThreatSeverityUtil.GetTypesDashboard().includes(x.Severity)).length });
      ThreatSeverityUtil.GetTypesDashboard().forEach(sev => {
        res.push({ name: translate.instant(ThreatSeverityUtil.ToString(sev)), value: mappings.filter(x => x.Severity == sev).length });
      });
      return res;
    };

    LifeCycleUtil.GetKeys().forEach(lc => {
      let mappings = allAttackScenarios.filter(x => x.AttackVector?.ThreatExploited.includes(lc));
      allAttackScenarios = allAttackScenarios.filter(x => !mappings.includes(x));
      let data: IStackedSeries = {
        name: translate.instant(LifeCycleUtil.ToString(lc)),
        series: getSeries(mappings)
      };
      diagramValues.push(data);
    });

    if (allAttackScenarios.length > 0) {
      let data: IStackedSeries = {
        name: translate.instant('general.Other'),
        series: getSeries(allAttackScenarios)
      };
      diagramValues.push(data);
    }

    let dia: IDiagramData = {
      results: diagramValues,
      view: [wid, hei],
      scheme: isBlueColorScheme ? 'air' : { domain: [ResultsAnalysisComponent.getNeutral(isDarkmode), DiaColors.Green, DiaColors.Yellow, DiaColors.Red, DiaColors.DarkRed] },
      xAxisLabel: translate.instant('pages.dashboard.SevertiyPerLifecycle'),
      yAxisLabel: translate.instant('pages.dashboard.NumberOfThreats')
    };
    return dia;
  }

  public static CreateSeverityPerTypeDiagram(pf: ProjectFile, translate: TranslateService, isDarkmode: boolean, isBlueColorScheme: boolean, wid, hei): IDiagramData {
    let diagramValues: IStackedSeries[] = [];
    let allAttackScenarios = pf.GetAttackScenariosApplicable();
    let getSeries = (mappings: AttackScenario[]): ISerie[] => {
      let res: ISerie[] = [];
      allAttackScenarios = allAttackScenarios.filter(x => !mappings.includes(x));
      res.push({ name: translate.instant('properties.threatstate.NotSet'), value: mappings.filter(x => !ThreatSeverityUtil.GetTypesDashboard().includes(x.Severity)).length });
      ThreatSeverityUtil.GetTypesDashboard().forEach(sev => {
        res.push({ name: translate.instant(ThreatSeverityUtil.ToString(sev)), value: mappings.filter(x => x.Severity == sev).length });
      });
      return res;
    };

    let hwViewIDs = pf.GetDevices().map(x => x.HardwareDiagram).filter(x => x).map(x => x.ID);
    let data: IStackedSeries = {
      name: translate.instant('general.Hardware'),
      series: getSeries(allAttackScenarios.filter(x => hwViewIDs.includes(x.ViewID)))
    };
    diagramValues.push(data);
    let swViewIDs = pf.GetDevices().map(x => x.SoftwareStack).filter(x => x).map(x => x.ID);
    swViewIDs.push(...pf.GetMobileApps().map(x => x.SoftwareStack).filter(x => x).map(x => x.ID));
    data = {
      name: translate.instant('general.Software'),
      series: getSeries(allAttackScenarios.filter(x => swViewIDs.includes(x.ViewID)))
    };
    diagramValues.push(data);
    let pViewIDs = pf.GetDevices().map(x => x.ProcessStack).filter(x => x).map(x => x.ID);
    pViewIDs.push(...pf.GetMobileApps().map(x => x.ProcessStack).filter(x => x).map(x => x.ID));
    data = {
      name: translate.instant('general.Process'),
      series: getSeries(allAttackScenarios.filter(x => pViewIDs.includes(x.ViewID)))
    };
    diagramValues.push(data);

    let dfdViewIDs = pf.GetDFDiagrams().map(x => x.ID);
    data = {
      name: translate.instant('general.DataFlow'),
      series: getSeries(allAttackScenarios.filter(x => dfdViewIDs.includes(x.ViewID)))
    };
    diagramValues.push(data);

    if (allAttackScenarios.length > 0) {
      let data: IStackedSeries = {
        name: translate.instant('general.Other'),
        series: getSeries(allAttackScenarios)
      };
      diagramValues.push(data);
    }

    let dia: IDiagramData = {
      results: diagramValues,
      view: [wid, hei],
      scheme: isBlueColorScheme ? 'air' : { domain: [ResultsAnalysisComponent.getNeutral(isDarkmode), DiaColors.Green, DiaColors.Yellow, DiaColors.Red, DiaColors.DarkRed] },
      xAxisLabel: translate.instant('pages.dashboard.SeverityPerType'),
      yAxisLabel: translate.instant('pages.dashboard.NumberOfThreats')
    };
    return dia;
  }

  public static CreateSeverityPerImpactCatDiagram(pf: ProjectFile, translate: TranslateService, isDarkmode: boolean, isBlueColorScheme: boolean, wid, hei): IDiagramData {
    let diagramValues: IStackedSeries[] = [];
    let allAttackScenarios = pf.GetAttackScenariosApplicable();
    let getSeries = (scenarios: AttackScenario[]): ISerie[] => {
      let res: ISerie[] = [];
      res.push({ name: translate.instant('properties.threatstate.NotSet'), value: scenarios.filter(x => !ThreatSeverityUtil.GetTypesDashboard().includes(x.Severity)).length });
      ThreatSeverityUtil.GetTypesDashboard().forEach(sev => {
        res.push({ name: translate.instant(ThreatSeverityUtil.ToString(sev)), value: scenarios.filter(x => x.Severity == sev).length });
      });
      return res;
    };

    ImpactCategoryUtil.GetKeys().forEach(cat => {
      let scenarios = allAttackScenarios.filter(x => x.SystemThreats.some(y => y.ImpactCats.includes(cat)));
      let data: IStackedSeries = {
        name: translate.instant(ImpactCategoryUtil.ToString(cat)),
        series: getSeries(scenarios)
      };
      diagramValues.push(data);
    });

    diagramValues = diagramValues.filter(x => !x.series.every(y => y.value == 0));

    let dia: IDiagramData = {
      results: diagramValues,
      view: [wid, hei],
      scheme: isBlueColorScheme ? 'air' : { domain: [ResultsAnalysisComponent.getNeutral(isDarkmode), DiaColors.Green, DiaColors.Yellow, DiaColors.Red, DiaColors.DarkRed] },
      xAxisLabel: translate.instant('pages.dashboard.SeverityPerImpactCategory'),
      yAxisLabel: translate.instant('pages.dashboard.NumberOfThreats')
    };
    return dia;
  }
  
  private static getNeutral(isDarkMode: boolean) {
    if (isDarkMode) return DiaColors.White;
    return DiaColors.Black;
  }

  public OpenTagCharts() {
    this.dialog.OpenTagChartsDialog().subscribe(() => {
      this.UpdateDiagrams();
    });
  }

  public GetSplitSize(splitter: number, gutter: number, defaultSize: number) {
    let size = this.locStorage.Get(LocStorageKeys.PAGE_DASHBOARD_SPLIT_SIZE_X + splitter.toString());
    if (size != null) return Number(JSON.parse(size)[gutter]);
    return defaultSize;
  }

  public OnSplitSizeChange(event, splitter: number) {
    this.locStorage.Set(LocStorageKeys.PAGE_DASHBOARD_SPLIT_SIZE_X + splitter.toString(), JSON.stringify(event['sizes']));
    this.UpdateDiagrams();
  }

  public OnMappingDblClick(entry, event = null) {
    if (entry instanceof AttackScenario) this.dialog.OpenAttackScenarioDialog(entry, false, this.dataSourceThreats.data);
    else if (entry instanceof Countermeasure) {
      if (event && event.target && this.displayedCountermeasureColumns[event.target.cellIndex] == 'progress' && entry.MitigationProcess) {
        this.dialog.OpenMitigationProcessDialog(entry.MitigationProcess, false);
      }
      else {
        this.dialog.OpenCountermeasureDialog(entry, false, [], this.dataSourceCountermeasures.data);
      }
    }
  }

  public ApplyThreatFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceThreats.filter = filterValue.trim().toLowerCase();
  }

  public ApplyCountermeasureFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceCountermeasures.filter = filterValue.trim().toLowerCase();
  }

  public IsThreatSelected(threat) {
    return this.selectedThreats.includes(threat);
  }

  public SelectThreat(threat) {
    this.selectedThreats = [threat];

    //if (threat.Target) this.selectedObjectChanged.emit(threat.Target);
  }

  public IsCountermeasureSelected(mit) {
    return this.selectedCountermeasures.includes(mit);
  }

  public SelectCountermeasure(mit) {
    this.selectedCountermeasures = [mit];
  }

  public GetViewName(entry) {
    let name = this.dataService.Project.GetDiagrams().find(x => x.ID == entry.ViewID)?.Name;
    if (!name) name = this.dataService.Project.GetStacks().find(x => x.ID == entry.ViewID)?.Name;
    return name;
  }

  public GetTargets(entry) {
    return entry.Targets.filter(x => x).map(x => x.GetProperty('Name')).join(', ');
  }

  public GetThreatStates() {
    return ThreatStateUtil.GetThreatStates();
  }

  public GetThreatStateName(ts: ThreatStates) {
    return ThreatStateUtil.ToString(ts);
  }

  public GetSeverityTypes() {
    return ThreatSeverityUtil.GetTypesDashboard();
  }

  public GetSeverityTypeName(sev: ThreatSeverities) {
    return ThreatSeverityUtil.ToString(sev);
  }

  public GetMitigationStates() {
    return MitigationStateUtil.GetMitigationStates();
  }

  public GetMitigationStateName(ts: MitigationStates) {
    return MitigationStateUtil.ToString(ts);
  }

  public GetLMHValues() {
    return LowMediumHighNumberUtil.GetKeys();
  }

  public GetLMHName(type: LowMediumHighNumber) {
    return LowMediumHighNumberUtil.ToString(type);
  }

  public OpenContextMenu(event, entry) {
    event.preventDefault();

    this.menuTopLeftPosition.x = event.clientX + 'px'; 
    this.menuTopLeftPosition.y = event.clientY + 'px'; 

    this.matMenuTrigger.menuData = { item: entry }; 
    this.matMenuTrigger.openMenu(); 
  }

  public ResetNumbers(item) {
    let maps: any[] = [];
    if (item instanceof AttackScenario) {
      maps = [
        ...this.dataService.Project.GetAttackScenariosApplicable().sort((a, b) => { return Number(a.Number) - Number(b.Number); }),
        ...this.dataService.Project.GetAttackScenariosNotApplicable().sort((a, b) => { return Number(a.Number) - Number(b.Number); }),
      ];
    }
    else if (item instanceof Countermeasure) {
      maps = [
        ...this.dataService.Project.GetCountermeasuresApplicable().sort((a, b) => { return Number(a.Number) - Number(b.Number); }),
        ...this.dataService.Project.GetCountermeasuresNotApplicable().sort((a, b) => { return Number(a.Number) - Number(b.Number); }),
      ];
    }

    for (let i = 0; i < maps.length; i++) {
      maps[i].Number = (i+1).toString();
    }
  }

  public ResetReorderNumbers(item) {
    if (item instanceof AttackScenario) {
      const asOrig = this.dataService.Project.GetAttackScenarios();
      const asApp = this.dataService.Project.GetAttackScenariosApplicable();
      const asNotApp = this.dataService.Project.GetAttackScenariosNotApplicable();

      const mySort = (a: AttackScenario, b: AttackScenario) => {
        const checkVal = (a, b) => {
          if (a >= 0 && b >= 0) {
            return Number(a) > Number(b) ? -1 : (Number(a) < Number(b) ? 1 : 0);
          }
          if (a) return -1;
          return 1;
        };

        let res = 0;

        if (a.ViewID != b.ViewID) {
          const order = { 'CTX': 0, 'UC': 1, 'HW': 2, 'DF': 3 };
          const viewA = this.dataService.Project.GetView(a.ViewID);
          const viewB = this.dataService.Project.GetView(b.ViewID);
          if (viewA instanceof Diagram && viewB instanceof Diagram) {
            res = order[viewA.DiagramType] < order[viewB.DiagramType] ? -1 : (order[viewA.DiagramType] == order[viewB.DiagramType] ? 0 : 1);
          }
          else if (viewA instanceof Diagram) res = order[viewA.DiagramType] < 3 ? -1 : 1;
          else if (viewB instanceof Diagram) res = order[viewB.DiagramType] < 3 ? 1 : -1;
          else {
            if (viewA.ComponentTypeID == viewB.ComponentTypeID) res = 0;
            else if (viewA.ComponentTypeID == MyComponentTypeIDs.Software) res = -1;
            else res = 1;
          }

          if (res == 0) res = viewA.Name.localeCompare(viewB.Name);
        }

        if (res == 0) res = checkVal(a.Risk, b.Risk);
        if (res == 0) res = checkVal(a.Severity, b.Severity);
        if (res == 0) res = checkVal(a.ThreatState, b.ThreatState);
        if (res == 0 && a.ScoreCVSS?.Score && b.ScoreCVSS?.Score) res = checkVal(a.ScoreCVSS, b.ScoreCVSS);
        else if (res == 0 && a.ScoreCVSS?.Score) res = -1;
        else if (res == 0 && b.ScoreCVSS?.Score) res = 1;
        if (res == 0 && a.Target && b.Target) res = a.Target.Name.localeCompare(b.Target.Name);
        if (res == 0) {
          res = checkVal(b.Number, a.Number);
        }
        return res;
      };

      asApp.sort((a, b) => mySort(a, b));
      for (let i = 0; i < asApp.length; i++) {
        this.dataService.Project.MoveItemAttackScenario(asOrig.indexOf(asApp[i]), i);
        asApp[i].Number = (i+1).toString();
      }
      asNotApp.sort((a, b) => mySort(a, b));
      for (let i = 0; i < asNotApp.length; i++) {
        this.dataService.Project.MoveItemAttackScenario(asOrig.indexOf(asNotApp[i]), i);
        asNotApp[i].Number = (asApp.length+i+1).toString();
      }

      this.AttackScenarios = this.dataService.Project.GetAttackScenariosApplicable().filter(x => x.MappingState != MappingStates.Removed);
    }
    else if (item instanceof Countermeasure) {
      const cmOrig = this.dataService.Project.GetCountermeasures();
      const cmApp = this.dataService.Project.GetCountermeasuresApplicable();
      const cmNotApp = this.dataService.Project.GetCountermeasuresNotApplicable();

      const mySort = (a: Countermeasure, b: Countermeasure) => {
        const checkVal = (a, b) => {
          if (a >= 0 && b >= 0) {
            return Number(a) > Number(b) ? -1 : (Number(a) < Number(b) ? 1 : 0);
          }
          if (a) return -1;
          return 1;
        };

        let res = 0;

        if (a.ViewID != b.ViewID) {
          const order = { 'CTX': 0, 'UC': 1, 'HW': 2, 'DF': 3 };
          const viewA = this.dataService.Project.GetView(a.ViewID);
          const viewB = this.dataService.Project.GetView(b.ViewID);
          if (viewA instanceof Diagram && viewB instanceof Diagram) {
            res = order[viewA.DiagramType] < order[viewB.DiagramType] ? -1 : (order[viewA.DiagramType] == order[viewB.DiagramType] ? 0 : 1);
          }
          else if (viewA instanceof Diagram) res = order[viewA.DiagramType] < 3 ? -1 : 1;
          else if (viewB instanceof Diagram) res = order[viewB.DiagramType] < 3 ? 1 : -1;
          else {
            if (viewA.ComponentTypeID == viewB.ComponentTypeID) res = 0;
            else if (viewA.ComponentTypeID == MyComponentTypeIDs.Software) res = -1;
            else res = 1;
          }

          if (res == 0) res = viewA.Name.localeCompare(viewB.Name);
        }

        if (res == 0) res = checkVal(a.MitigationState, b.MitigationState);
        if (res == 0 && a.Targets && b.Targets) res = a.Targets.map(x => x.Name).join(', ').localeCompare(b.Targets.map(x => x.Name).join(', '));
        if (res == 0 && a.MitigationProcess && b.MitigationProcess) res = checkVal(a.MitigationProcess.Number, b.MitigationProcess.Number);
        if (res == 0) {
          res = checkVal(b.Number, a.Number);
        }
        return res;
      };

      cmApp.sort((a, b) => mySort(a, b));
      for (let i = 0; i < cmApp.length; i++) {
        this.dataService.Project.MoveItemCountermeasures(cmOrig.indexOf(cmApp[i]), i);
        cmApp[i].Number = (i+1).toString();
      }
      cmNotApp.sort((a, b) => mySort(a, b));
      for (let i = 0; i < cmNotApp.length; i++) {
        this.dataService.Project.MoveItemCountermeasures(cmOrig.indexOf(cmNotApp[i]), i);
        cmNotApp[i].Number = (cmApp.length+i+1).toString();
      }

      this.Countermeasures = this.dataService.Project.GetCountermeasuresApplicable().filter(x => x.MappingState != MappingStates.Removed);
    }
  }
}
