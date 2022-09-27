import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { DiagramTypes } from '../../model/diagram';
import { MitigationMapping, MitigationStates, MitigationStateUtil } from '../../model/mitigations';
import { ThreatMapping, ThreatStates, MappingStates, ThreatSeverityUtil, LifeCycleUtil, ThreatStateUtil, ThreatSeverities } from '../../model/threat-model';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { LocalStorageService, LocStorageKeys } from '../../util/local-storage.service';

import { LowMediumHighNumberUtil, LowMediumHighNumber } from '../../model/assets';
import { ThemeService } from '../../util/theme.service';
import { ProjectFile } from '../../model/project-file';

enum DiaColors {
  Black = '#000000',
  White = '#FFFFFF',
  Green = '#339900',
  Yellow = '#FFCC00',
  Red = '#FF2417',
  DarkRed = '#400000'
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
  private _threatMappings: ThreatMapping[] = [];
  private _selectedThreats: ThreatMapping[] = [];
  private _mitigationMappings: MitigationMapping[] = [];
  private _selectedMitigations: MitigationMapping[] = [];

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
  @ViewChild('mitigationtable') sortMitigations: MatSort;

  public diagrams: IDiagramData[] = [];

  public displayedThreatColumns = ['number', 'name', 'elements', 'view', 'severity', 'risk', 'status'];
  public dataSourceThreats: MatTableDataSource<ThreatMapping>;
  public displayedMitigationColumns = ['number', 'name', 'targets', 'view', 'progress', 'status'];
  public dataSourceMitigations: MatTableDataSource<MitigationMapping>;

  public get ThreatMappings(): ThreatMapping[] { return this._threatMappings; }
  public set ThreatMappings(val: ThreatMapping[]) {
    this._threatMappings = val;
    let mySort = (data: ThreatMapping, sortHeaderId: string) => {
      if (sortHeaderId == 'number') return Number(data.Number);
      if (sortHeaderId == 'name') return data.Name;
      if (sortHeaderId == 'elements') return this.GetTargets(data);
      if (sortHeaderId == 'view') return this.GetViewName(data);
      if (sortHeaderId == 'severity') return data.Severity;
      if (sortHeaderId == 'risk') return data.Risk;
      if (sortHeaderId == 'status') return data.ThreatState; 
      console.error('Missing sorting header', sortHeaderId); 
    };
    let myFilter = (data: ThreatMapping, filter: string) => {
      let search = filter.trim().toLowerCase();
      let res = data.Name.toLowerCase().indexOf(search);
      if (res == -1) res = data.ThreatOrigin.Name.toLowerCase().indexOf(search);
      if (res == -1) res = this.GetTargets(data).toLowerCase().indexOf(search); 
      return res != -1;
    };

    this.dataSourceThreats = new MatTableDataSource(val.filter(x => x.ThreatState != ThreatStates.NotApplicable));
    this.dataSourceThreats.sort = this.sortThreats;
    this.dataSourceThreats.sortingDataAccessor = mySort;
    this.dataSourceThreats.filterPredicate = myFilter;

    if (this.sortThreats) this.sortThreats.sortChange.emit(this.sortThreats);
  }
  public get selectedThreats(): ThreatMapping[] { return this._selectedThreats; }
  public set selectedThreats(val: ThreatMapping[]) {
    if (val.length == this._selectedThreats.length) {
      if (val.every(x => this._selectedThreats.some(y => y.ID == x.ID))) return;
    }
    this._selectedThreats = val;

    if (val.length == 1) {
      this.selectedMitigations = this.MitigationMappings.filter(x => x.ThreatMappings.includes(val[0]));
    }
  }

  public get MitigationMappings(): MitigationMapping[] { return this._mitigationMappings; }
  public set MitigationMappings(val: MitigationMapping[]) {
    this._mitigationMappings = val;
    let mySort = (data: MitigationMapping, sortHeaderId: string) => {
      if (sortHeaderId == 'number') return Number(data.Number);
      if (sortHeaderId == 'name') return data.Name;
      if (sortHeaderId == 'targets') return this.GetTargets(data);
      if (sortHeaderId == 'view') return this.GetViewName(data);
      if (sortHeaderId == 'status') return data.MitigationState; 
      console.error('Missing sorting header', sortHeaderId); 
    };
    let myFilter = (data: MitigationMapping, filter: string) => {
      let search = filter.trim().toLowerCase();
      let res = data.Name.toLowerCase().indexOf(search);
      if (res == -1) res = data.Mitigation.Name.toLowerCase().indexOf(search);
      if (res == -1) res = this.GetTargets(data).toLowerCase().indexOf(search);
      return res != -1;
    };

    this.dataSourceMitigations = new MatTableDataSource(val.filter(x => x.MitigationState != MitigationStates.NotApplicable));
    this.dataSourceMitigations.sort = this.sortMitigations;
    this.dataSourceMitigations.sortingDataAccessor = mySort;
    this.dataSourceMitigations.filterPredicate = myFilter;

    if (this.sortMitigations) this.sortMitigations.sortChange.emit(this.sortMitigations);
  }
  public get selectedMitigations(): MitigationMapping[] { return this._selectedMitigations; }
  public set selectedMitigations(val: MitigationMapping[]) {
    if (val.length == this._selectedMitigations.length) {
      if (val.every(x => this._selectedMitigations.some(y => y.ID == x.ID))) return;
    }
    this._selectedMitigations = val;

    if (val.length == 1) {
      this.selectedThreats = this.ThreatMappings.filter(x => val[0].ThreatMappings.includes(x));
    }
  }

  constructor(public theme: ThemeService, public dataService: DataService, public dialog: DialogService, private translate: TranslateService, private locStorage: LocalStorageService, public elRef: ElementRef) { }

  ngAfterViewInit(): void {
    let setData = () => {
      setTimeout(() => {
        this.ThreatMappings = this.dataService.Project.GetThreatMappings().filter(x => x.MappingState != MappingStates.Removed && x.ThreatState != ThreatStates.NotApplicable);
        this.MitigationMappings = this.dataService.Project.GetMitigationMappings().filter(x => x.MappingState != MappingStates.Removed && x.MitigationState != MitigationStates.NotApplicable);
      
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

    let dia1 = ResultsAnalysisComponent.CreateThreatSummaryDiagram(this.dataService.Project, this.translate, this.theme.IsDarkMode, this.isBlueColorScheme, wid, hei);
    let dia2 = ResultsAnalysisComponent.CreateMitigationSummaryDiagram(this.dataService.Project, this.translate, this.theme.IsDarkMode, this.isBlueColorScheme, wid, hei);
    let dia3 = ResultsAnalysisComponent.CreateThreatPerLifecycleDiagram(this.dataService.Project, this.translate, this.theme.IsDarkMode, this.isBlueColorScheme, wid, hei);
    let dia4 = ResultsAnalysisComponent.CreateThreatPerTypeDiagram(this.dataService.Project, this.translate, this.theme.IsDarkMode, this.isBlueColorScheme, wid, hei);

    this.diagrams = [dia1, dia2, dia3, dia4];
  }

  public UpdateDiagramsDelayed() {
    this.updateDiagramsDelayCounter++;
    setTimeout(() => {
      this.updateDiagramsDelayCounter--;
      if (this.updateDiagramsDelayCounter == 0) this.UpdateDiagrams();
    }, 3000);
  }

  public static CreateThreatSummaryDiagram(pf: ProjectFile, translate: TranslateService, isDarkmode: boolean, isBlueColorScheme: boolean, wid, hei): IDiagramData {
    let diagramValues: IStackedSeries[] = [];
    let allThreatMappings = pf.GetThreatMappings();
    let getSeries = (mappings: ThreatMapping[]): ISerie[] => {
      let res: ISerie[] = [];
      allThreatMappings = allThreatMappings.filter(x => !mappings.includes(x));
      res.push({ name: translate.instant('properties.threatstate.NotSet'), value: mappings.filter(x => !ThreatSeverityUtil.GetTypes().includes(x.Severity)).length });
      ThreatSeverityUtil.GetTypes().forEach(sev => {
        res.push({ name: translate.instant(ThreatSeverityUtil.ToString(sev)), value: mappings.filter(x => x.Severity == sev).length });
      });
      return res;
    };

    pf.GetDevices().forEach(dev => {
      let data: IStackedSeries = {
        name: dev.GetProperty('Name'),
        series: getSeries(dev.GetThreatMappings())
      };
      diagramValues.push(data);
    });
    pf.GetMobileApps().forEach(app => {
      let data: IStackedSeries = {
        name: app.GetProperty('Name'),
        series: getSeries(app.GetThreatMappings())
      };
      diagramValues.push(data);
    });
    pf.GetDiagrams().filter(x => x.DiagramType == DiagramTypes.DataFlow).forEach(dfd => {
      let data: IStackedSeries = {
        name: dfd.GetProperty('Name'),
        series: getSeries(pf.GetThreatMappings().filter(x => x.ViewID == dfd.ID))
      };
      diagramValues.push(data);
    });

    if (allThreatMappings.length > 0) {
      let data: IStackedSeries = {
        name: translate.instant('general.Other'),
        series: getSeries(allThreatMappings)
      };
      diagramValues.push(data);
    }

    let dia: IDiagramData = {
      results: diagramValues,
      view: [wid, hei],
      scheme: isBlueColorScheme ? 'air' : { domain: [ResultsAnalysisComponent.getNeutral(isDarkmode), DiaColors.Green, DiaColors.Yellow, DiaColors.Red, DiaColors.DarkRed] },
      xAxisLabel: translate.instant('pages.dashboard.ThreatSummary'),
      yAxisLabel: translate.instant('pages.dashboard.NumberOfThreats')
    };
    return dia;
  }

  public static CreateMitigationSummaryDiagram(pf: ProjectFile, translate: TranslateService, isDarkmode: boolean, isBlueColorScheme: boolean, wid, hei): IDiagramData {
    let diagramValues: IStackedSeries[] = [];
    let allMitigationMappings = pf.GetMitigationMappings();
    let getSeries = (mappings: MitigationMapping[]): ISerie[] => {
      let res: ISerie[] = [];
      allMitigationMappings = allMitigationMappings.filter(x => !mappings.includes(x));
      MitigationStateUtil.GetMitigationStates().filter(x => x != MitigationStates.NotApplicable).forEach(state => {
        res.push({ name: translate.instant(MitigationStateUtil.ToString(state)), value: mappings.filter(x => x.MitigationState == state).length });
      });
      return res;
    };

    pf.GetDevices().forEach(dev => {
      let data: IStackedSeries = {
        name: dev.GetProperty('Name'),
        series: getSeries(dev.GetMitigationMappings())
      };
      diagramValues.push(data);
    });
    pf.GetMobileApps().forEach(app => {
      let data: IStackedSeries = {
        name: app.GetProperty('Name'),
        series: getSeries(app.GetMitigationMappings())
      };
      diagramValues.push(data);
    });
    pf.GetDiagrams().filter(x => x.DiagramType == DiagramTypes.DataFlow).forEach(dfd => {
      let data: IStackedSeries = {
        name: dfd.GetProperty('Name'),
        series: getSeries(pf.GetMitigationMappings().filter(x => x.ViewID == dfd.ID))
      };
      diagramValues.push(data);
    });

    if (allMitigationMappings.length > 0) {
      let data: IStackedSeries = {
        name: translate.instant('general.Other'),
        series: getSeries(allMitigationMappings)
      };
      diagramValues.push(data);
    }

    let dia: IDiagramData = {
      results: diagramValues,
      view: [wid, hei],
      scheme: isBlueColorScheme ? 'air' : { domain: [DiaColors.DarkRed, ResultsAnalysisComponent.getNeutral(isDarkmode), DiaColors.Red, DiaColors.Yellow, DiaColors.Green] },
      xAxisLabel: translate.instant('pages.dashboard.MitigationSummary'),
      yAxisLabel: translate.instant('pages.dashboard.NumberOfMitigations')
    };
    return dia;
  }

  public static CreateThreatPerLifecycleDiagram(pf: ProjectFile, translate: TranslateService, isDarkmode: boolean, isBlueColorScheme: boolean, wid, hei): IDiagramData {
    let diagramValues: IStackedSeries[] = [];
    let allThreatMappings = pf.GetThreatMappings();
    let getSeries = (mappings: ThreatMapping[]): ISerie[] => {
      let res: ISerie[] = [];
      allThreatMappings = allThreatMappings.filter(x => !mappings.includes(x));
      res.push({ name: translate.instant('properties.threatstate.NotSet'), value: mappings.filter(x => !ThreatSeverityUtil.GetTypes().includes(x.Severity)).length });
      ThreatSeverityUtil.GetTypes().forEach(sev => {
        res.push({ name: translate.instant(ThreatSeverityUtil.ToString(sev)), value: mappings.filter(x => x.Severity == sev).length });
      });
      return res;
    };

    LifeCycleUtil.GetKeys().forEach(lc => {
      let mappings = allThreatMappings.filter(x => x.ThreatOrigin?.ThreatExploited.includes(lc));
      allThreatMappings = allThreatMappings.filter(x => !mappings.includes(x));
      let data: IStackedSeries = {
        name: translate.instant(LifeCycleUtil.ToString(lc)),
        series: getSeries(mappings)
      };
      diagramValues.push(data);
    });

    if (allThreatMappings.length > 0) {
      let data: IStackedSeries = {
        name: translate.instant('general.Other'),
        series: getSeries(allThreatMappings)
      };
      diagramValues.push(data);
    }

    let dia: IDiagramData = {
      results: diagramValues,
      view: [wid, hei],
      scheme: isBlueColorScheme ? 'air' : { domain: [ResultsAnalysisComponent.getNeutral(isDarkmode), DiaColors.Green, DiaColors.Yellow, DiaColors.Red, DiaColors.DarkRed] },
      xAxisLabel: translate.instant('pages.dashboard.ThreatPerLifecycle'),
      yAxisLabel: translate.instant('pages.dashboard.NumberOfThreats')
    };
    return dia;
  }

  public static CreateThreatPerTypeDiagram(pf: ProjectFile, translate: TranslateService, isDarkmode: boolean, isBlueColorScheme: boolean, wid, hei): IDiagramData {
    let diagramValues: IStackedSeries[] = [];
    let allThreatMappings = pf.GetThreatMappings();
    let getSeries = (mappings: ThreatMapping[]): ISerie[] => {
      let res: ISerie[] = [];
      allThreatMappings = allThreatMappings.filter(x => !mappings.includes(x));
      res.push({ name: translate.instant('properties.threatstate.NotSet'), value: mappings.filter(x => !ThreatSeverityUtil.GetTypes().includes(x.Severity)).length });
      ThreatSeverityUtil.GetTypes().forEach(sev => {
        res.push({ name: translate.instant(ThreatSeverityUtil.ToString(sev)), value: mappings.filter(x => x.Severity == sev).length });
      });
      return res;
    };

    let hwViewIDs = pf.GetDevices().map(x => x.HardwareDiagram).filter(x => x).map(x => x.ID);
    let data: IStackedSeries = {
      name: translate.instant('general.Hardware'),
      series: getSeries(allThreatMappings.filter(x => hwViewIDs.includes(x.ViewID)))
    };
    diagramValues.push(data);
    let swViewIDs = pf.GetDevices().map(x => x.SoftwareStack).filter(x => x).map(x => x.ID);
    swViewIDs.push(...pf.GetMobileApps().map(x => x.SoftwareStack).filter(x => x).map(x => x.ID));
    data = {
      name: translate.instant('general.Software'),
      series: getSeries(allThreatMappings.filter(x => swViewIDs.includes(x.ViewID)))
    };
    diagramValues.push(data);
    let pViewIDs = pf.GetDevices().map(x => x.ProcessStack).filter(x => x).map(x => x.ID);
    pViewIDs.push(...pf.GetMobileApps().map(x => x.ProcessStack).filter(x => x).map(x => x.ID));
    data = {
      name: translate.instant('general.Process'),
      series: getSeries(allThreatMappings.filter(x => pViewIDs.includes(x.ViewID)))
    };
    diagramValues.push(data);

    let dfdViewIDs = pf.GetDiagrams().filter(x => x.DiagramType == DiagramTypes.DataFlow).map(x => x.ID);
    data = {
      name: translate.instant('general.DataFlow'),
      series: getSeries(allThreatMappings.filter(x => dfdViewIDs.includes(x.ViewID)))
    };
    diagramValues.push(data);

    if (allThreatMappings.length > 0) {
      let data: IStackedSeries = {
        name: translate.instant('general.Other'),
        series: getSeries(allThreatMappings)
      };
      diagramValues.push(data);
    }

    let dia: IDiagramData = {
      results: diagramValues,
      view: [wid, hei],
      scheme: isBlueColorScheme ? 'air' : { domain: [ResultsAnalysisComponent.getNeutral(isDarkmode), DiaColors.Green, DiaColors.Yellow, DiaColors.Red, DiaColors.DarkRed] },
      xAxisLabel: translate.instant('pages.dashboard.ThreatPerType'),
      yAxisLabel: translate.instant('pages.dashboard.NumberOfThreats')
    };
    return dia;
  }
  
  private static getNeutral(isDarkMode: boolean) {
    if (isDarkMode) return DiaColors.White;
    return DiaColors.Black;
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
    if (entry instanceof ThreatMapping) this.dialog.OpenThreatMappingDialog(entry, false);
    else if (entry instanceof MitigationMapping) {
      if (event && event.target && this.displayedMitigationColumns[event.target.cellIndex] == 'progress' && entry.MitigationProcess) {
        this.dialog.OpenMitigationProcessDialog(entry.MitigationProcess, false);
      }
      else {
        this.dialog.OpenMitigationMappingDialog(entry, false, []);
      }
    }
  }

  public ApplyThreatFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceThreats.filter = filterValue.trim().toLowerCase();
  }

  public ApplyMitigationFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceMitigations.filter = filterValue.trim().toLowerCase();
  }

  public IsThreatSelected(threat) {
    return this.selectedThreats.includes(threat);
  }

  public SelectThreat(threat) {
    this.selectedThreats = [threat];

    //if (threat.Target) this.selectedObjectChanged.emit(threat.Target);
  }

  public IsMitigationSelected(mit) {
    return this.selectedMitigations.includes(mit);
  }

  public SelectMitigation(mit) {
    this.selectedMitigations = [mit];
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
    return ThreatSeverityUtil.GetTypes();
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
    if (item instanceof ThreatMapping) maps = this.dataService.Project.GetThreatMappings();
    else if (item instanceof MitigationMapping) maps = this.dataService.Project.GetMitigationMappings();

    maps.sort((a, b) => {
      return Number(a.Number) - Number(b.Number);
    });

    for (let i = 0; i < maps.length; i++) {
      maps[i].Number = (i+1).toString();
    }
  }
}
