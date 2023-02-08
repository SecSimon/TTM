import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSort } from '@angular/material/sort';
import { MyComponentStack } from '../../model/component';
import { Diagram, HWDFDiagram } from '../../model/diagram';
import { MappingStates, AttackScenario, ThreatStates, ThreatStateUtil } from '../../model/threat-model';
import { DataService } from '../../util/data.service';
import { ThemeService } from '../../util/theme.service';
import { ThreatEngineService } from '../../util/threat-engine.service';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { DialogService } from '../../util/dialog.service';
import { DataChangedTypes, ViewElementBase } from '../../model/database';
import { TranslateService } from '@ngx-translate/core';
import { Control, Countermeasure, MitigationStates } from '../../model/mitigations';

@Component({
  selector: 'app-threat-table',
  templateUrl: './threat-table.component.html',
  styleUrls: ['./threat-table.component.scss']
})
export class ThreatTableComponent implements OnInit {
  private changesCounter = 0;
  private isCalculatingThreats = false;
  private _selectedNode: INavigationNode;
  private _selectedObject: ViewElementBase;
  private _attackScenarios: AttackScenario[] = [];
  private _selectedThreats: AttackScenario[] = [];

  private countermeasureCounts = {}; 

  public displayedColumns = [];
  public dataSourceActive: MatTableDataSource<AttackScenario>;
  public dataSourceNA: MatTableDataSource<AttackScenario>;
  public autoRefreshThreats = true;
  public get refreshingThreats(): boolean {
    return this.changesCounter > 0 || this.isCalculatingThreats;
  }

  public menuTopLeftPosition =  {x: '0', y: '0'};
  @ViewChild(MatMenuTrigger) public matMenuTrigger: MatMenuTrigger; 
  
  public get AttackScenarios(): AttackScenario[] { return this._attackScenarios; }
  public set AttackScenarios(val: AttackScenario[]) {
    this._attackScenarios = val;
    let mySort = (data: AttackScenario, sortHeaderId: string) => {
      if (sortHeaderId == 'name') return data.Name;
      if (sortHeaderId == 'number') return Number(data.Number);
      if (sortHeaderId == 'state') return data.MappingState; 
      if (sortHeaderId == 'type') return data.IsGenerated ? 1 : 0; 
      if (sortHeaderId == 'vector') return data.AttackVector.Name; 
      if (sortHeaderId == 'status') return data.ThreatState; 
      if (sortHeaderId == 'categories') return this.GetThreatCategories(data); 
      if (sortHeaderId == 'target') return data.Target.Name;
      if (sortHeaderId == 'rule') return data.ThreatRule.Name;
      if (sortHeaderId == 'elements') return this.GetTargets(data);
      console.error('Missing sorting header'); 
    };
    let myFilter = (data: AttackScenario, filter: string) => {
      let search = filter.trim().toLowerCase();
      let res = data.Name.toLowerCase().indexOf(search);
      if (res == -1) res = data.AttackVector.Name.toLowerCase().indexOf(search);
      if (res == -1) res = this.GetThreatCategories(data).toLowerCase().indexOf(search);
      if (res == -1) res = this.GetTargets(data).toLowerCase().indexOf(search); 
      if (res == -1) res = data.ThreatRule.Name.toLowerCase().indexOf(search);
      return res != -1;
    };

    this.dataSourceActive = new MatTableDataSource(val.filter(x => ![ThreatStates.NotApplicable, ThreatStates.Duplicate].includes(x.ThreatState)));
    this.dataSourceActive.sort = this.sort;
    this.dataSourceActive.sortingDataAccessor = mySort;
    this.dataSourceActive.filterPredicate = myFilter;

    this.dataSourceNA = new MatTableDataSource(val.filter(x => [ThreatStates.NotApplicable, ThreatStates.Duplicate].includes(x.ThreatState)));
    this.dataSourceNA.sort = this.sort;
    this.dataSourceNA.sortingDataAccessor = mySort;
    this.dataSourceNA.filterPredicate = myFilter;

    if (this.sort) this.sort.sortChange.emit(this.sort);
  }
  public get selectedThreats(): AttackScenario[] { return this._selectedThreats; }
  public set selectedThreats(val: AttackScenario[]) {
    if (val.length == this._selectedThreats.length) {
      if (val.every(x => this._selectedThreats.some(y => y.ID == x.ID))) return;
    }
    this._selectedThreats = val;
  } 

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  @Input() public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
    this.displayedColumns = ['state', 'number', 'type', 'name', 'vector', 'target'];
    if (this._selectedNode?.data instanceof HWDFDiagram) {
      this.displayedColumns.push('elements');
    }
    this.displayedColumns.push(...['countermeasures', 'status']);
    this.RefreshThreats();
  }
  @Input() public set selectedObject(val: ViewElementBase) {
    if (val && this._selectedObject?.ID == val.ID) return;
    this._selectedObject = val;
    this.selectedThreats = this.AttackScenarios.filter(x => x.Targets.includes(val));
  }
  @Output() public selectedObjectChanged = new EventEmitter<ViewElementBase>();

  @Output() public threatCountChanged = new EventEmitter<number>();
  
  @ViewChild(MatSort) sort: MatSort;

  constructor(public theme: ThemeService, public dataService: DataService, private threatEngine: ThreatEngineService, 
    private dialog: DialogService, private translate: TranslateService) { 
    let onDataChanged = () => {
      if (this.autoRefreshThreats) {
        if (this.changesCounter == 0) {
          setTimeout(() => {
            this.isCalculatingThreats = true;
            this.changesCounter++;
          }, 10);
        }
        else { this.changesCounter++; }
        setTimeout(() => {
          this.changesCounter--;
          if (this.changesCounter == 0) {
            this.RefreshThreats();
          }
        }, 3000);
      }
    };
    if (this.dataService.Project) {
      setTimeout(() => {
        this.dataService.Project?.DFDElementsChanged.subscribe(x => onDataChanged());
        this.dataService.Project?.MyComponentsChanged.subscribe(x => onDataChanged());
        this.dataService.Project?.AttackScenariosChanged.subscribe(x => { 
          if (x.Type == DataChangedTypes.Added) {
            if (!this.dataService.Project.GetAttackScenario(x.ID).IsGenerated) onDataChanged();
          }
          this.countermeasureCounts = {};
        });
        this.dataService.Project?.CountermeasuresChanged.subscribe(x => this.countermeasureCounts = {});
      }, 1000);
    }
  }

  ngOnInit(): void {
  }

  public RefreshThreats() {
    setTimeout(() => {
      this.AttackScenarios = [];
      if (this._selectedNode?.data) {
        if (this._selectedNode?.data instanceof Diagram) {
          this.AttackScenarios = this.threatEngine.GenerateDiagramThreats(this._selectedNode.data);
        }
        else if (this._selectedNode?.data instanceof MyComponentStack) {
          this.AttackScenarios = this.threatEngine.GenerateStackThreats(this._selectedNode.data);
        }
      }

      this.threatCountChanged.emit(this.AttackScenarios.length);
      this.countermeasureCounts = {};
      this.isCalculatingThreats = false;
    }, 10);
  }

  public OnMappingDblClick(entry: AttackScenario, event) {
    if (event && event.target && this.displayedColumns[event.target.cellIndex] == 'countermeasures' && this.dataService.Project.GetCountermeasures().filter(x => x.AttackScenarios.includes(entry)).length  > 0) {
      this.OnViewCountermeasures(entry);
    }
    else {
      this.dialog.OpenAttackScenarioDialog(entry, false, [...this.dataSourceActive.data, ...this.dataSourceNA.data]);
    }
  }

  public ApplyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceActive.filter = filterValue.trim().toLowerCase();
    this.dataSourceNA.filter = filterValue.trim().toLowerCase();
  }

  public IsThreatSelected(threat) {
    return this.selectedThreats.includes(threat);
  }

  public IsThreatRemoved(threat: AttackScenario) {
    return threat.MappingState == MappingStates.Removed;
  }

  public IsThreatNotApplying(threat: AttackScenario) {
    return [ThreatStates.NotApplicable, ThreatStates.Duplicate].includes(threat.ThreatState);
  }

  public SelectThreat(threat) {
    this.selectedThreats = [threat];

    if (threat.Target) this.selectedObjectChanged.emit(threat.Target);
  }

  public AddCountermeasure(entry: AttackScenario) {
    let map = this.dataService.Project.CreateCountermeasure(this.selectedNode.data['ID'], false);
    map.SetMapping(null, entry.Targets, [entry]);
    let elements: ViewElementBase[] = [];
    if (this.selectedNode.data instanceof Diagram) elements = this.selectedNode.data.Elements.GetChildrenFlat();
    else if (this.selectedNode.data instanceof MyComponentStack) elements = this.selectedNode.data.GetChildrenFlat();
    this.dialog.OpenCountermeasureDialog(map, true, elements).subscribe(result => {
      if (!result) {
        this.dataService.Project.DeleteCountermeasure(map);
      }
      this.countermeasureCounts[entry.ID] = null;
    });
  }

  public AddExistingCountermeasure(entry: AttackScenario, mit: Countermeasure) {
    mit.AddAttackScenario(entry);
    this.countermeasureCounts[entry.ID] = null;
    if (entry.Target) mit.AddTarget(entry.Target);
  }

  public GetPossibleCountermeasures(entry: AttackScenario) {
    return this.dataService.Project.GetCountermeasuresApplicable().filter(x => !x.AttackScenarios.includes(entry)).sort((a,b) => {
      return a.GetDiagram().Name.localeCompare(b.GetDiagram().Name);
    });
  }

  public OnViewCountermeasures(entry: AttackScenario) {
    this.dataService.Project.GetCountermeasures().filter(x => x.AttackScenarios.includes(entry)).forEach(x => {
      this.dialog.OpenCountermeasureDialog(x, false, null);
    });
  }

  public OnDeleteMapping(entry: AttackScenario) {
    this.dataService.Project.DeleteAttackScenario(entry);
    this.RefreshThreats();
  }

  public ResetNumbers() {
    const maps = this.dataService.Project.GetAttackScenarios().sort((a, b) => {
      return Number(a.Number) - Number(b.Number);
    });

    for (let i = 0; i < maps.length; i++) {
      maps[i].Number = (i+1).toString();
    }
  }

  public OpenContextMenu(event, entry: AttackScenario) {
    event.preventDefault();

    this.menuTopLeftPosition.x = event.clientX + 'px'; 
    this.menuTopLeftPosition.y = event.clientY + 'px'; 

    this.matMenuTrigger.menuData = { item: entry }; 
    this.matMenuTrigger.openMenu(); 
  }

  public GetStateIcon(entry: AttackScenario) {
    if (entry.MappingState == MappingStates.New) return 'add';
    if (entry.MappingState == MappingStates.Removed) return 'remove';
    return '';
  }

  public GetCreationTypeIcon(entry: AttackScenario) {
    if (entry.IsGenerated) return 'settings_suggest';
    else return 'handyman';
  }

  public GetCreationTypeIconTooltip(entry: AttackScenario) {
    if (entry.IsGenerated) return 'general.Generated';
    else return 'general.Manual';
  }

  public GetThreatCategories(entry: AttackScenario) {
    return entry.ThreatCategories.map(x => x.Name).join(', ');
  }

  public GetTargets(entry: AttackScenario) {
    return entry.Targets.map(x => x.GetProperty('Name')).join(', ');
  }

  public GetCountermeasures(entry: AttackScenario) {
    if (this.countermeasureCounts[entry.ID] == null) {
      const count = this.dataService.Project.GetCountermeasuresApplicable().filter(x => x.AttackScenarios.includes(entry)).length;
      if (count == 0) this.countermeasureCounts[entry.ID] = this.translate.instant('pages.modeling.threattable.noCountermeasure');
      else this.countermeasureCounts[entry.ID] = count.toString() + ' ' + this.translate.instant('pages.modeling.threattable.countermeasures');
    } 

    return this.countermeasureCounts[entry.ID];
  }

  public GetThreatStates() {
    return ThreatStateUtil.GetThreatStates();
  }

  public GetThreatStateName(ts: ThreatStates) {
    return ThreatStateUtil.ToString(ts);
  }
}
