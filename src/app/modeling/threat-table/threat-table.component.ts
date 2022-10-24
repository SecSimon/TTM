import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSort } from '@angular/material/sort';
import { MyComponentStack } from '../../model/component';
import { Diagram, HWDFDiagram } from '../../model/diagram';
import { MappingStates, ThreatMapping, ThreatStates, ThreatStateUtil } from '../../model/threat-model';
import { DataService } from '../../util/data.service';
import { ThemeService } from '../../util/theme.service';
import { ThreatEngineService } from '../../util/threat-engine.service';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { DialogService } from '../../util/dialog.service';
import { DataChangedTypes, ViewElementBase } from '../../model/database';
import { TranslateService } from '@ngx-translate/core';
import { Mitigation, MitigationMapping } from '../../model/mitigations';

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
  private _threatMappings: ThreatMapping[] = [];
  private _selectedThreats: ThreatMapping[] = [];

  private mitigationMappingCounts = {}; 

  public displayedColumns = [];
  public dataSourceActive: MatTableDataSource<ThreatMapping>;
  public dataSourceNA: MatTableDataSource<ThreatMapping>;
  public autoRefreshThreats = true;
  public get refreshingThreats(): boolean {
    return this.changesCounter > 0 || this.isCalculatingThreats;
  }

  public menuTopLeftPosition =  {x: '0', y: '0'};
  @ViewChild(MatMenuTrigger) public matMenuTrigger: MatMenuTrigger; 
  
  public get ThreatMappings(): ThreatMapping[] { return this._threatMappings; }
  public set ThreatMappings(val: ThreatMapping[]) {
    this._threatMappings = val;
    let mySort = (data: ThreatMapping, sortHeaderId: string) => {
      if (sortHeaderId == 'name') return data.Name;
      if (sortHeaderId == 'number') return Number(data.Number);
      if (sortHeaderId == 'state') return data.MappingState; 
      if (sortHeaderId == 'type') return data.IsGenerated ? 1 : 0; 
      if (sortHeaderId == 'origin') return data.ThreatOrigin.Name; 
      if (sortHeaderId == 'status') return data.ThreatState; 
      if (sortHeaderId == 'categories') return this.GetThreatCategories(data); 
      if (sortHeaderId == 'target') return data.Target.Name;
      if (sortHeaderId == 'rule') return data.ThreatRule.Name;
      if (sortHeaderId == 'elements') return this.GetTargets(data);
      console.error('Missing sorting header'); 
    };
    let myFilter = (data: ThreatMapping, filter: string) => {
      let search = filter.trim().toLowerCase();
      let res = data.Name.toLowerCase().indexOf(search);
      if (res == -1) res = data.ThreatOrigin.Name.toLowerCase().indexOf(search);
      if (res == -1) res = this.GetThreatCategories(data).toLowerCase().indexOf(search);
      if (res == -1) res = this.GetTargets(data).toLowerCase().indexOf(search); 
      if (res == -1) res = data.ThreatRule.Name.toLowerCase().indexOf(search);
      return res != -1;
    };

    this.dataSourceActive = new MatTableDataSource(val.filter(x => x.ThreatState != ThreatStates.NotApplicable));
    this.dataSourceActive.sort = this.sort;
    this.dataSourceActive.sortingDataAccessor = mySort;
    this.dataSourceActive.filterPredicate = myFilter;

    this.dataSourceNA = new MatTableDataSource(val.filter(x => x.ThreatState == ThreatStates.NotApplicable));
    this.dataSourceNA.sort = this.sort;
    this.dataSourceNA.sortingDataAccessor = mySort;
    this.dataSourceNA.filterPredicate = myFilter;

    if (this.sort) this.sort.sortChange.emit(this.sort);
  }
  public get selectedThreats(): ThreatMapping[] { return this._selectedThreats; }
  public set selectedThreats(val: ThreatMapping[]) {
    if (val.length == this._selectedThreats.length) {
      if (val.every(x => this._selectedThreats.some(y => y.ID == x.ID))) return;
    }
    this._selectedThreats = val;
  } 

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  @Input() public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
    this.displayedColumns = ['state', 'number', 'type', 'name', 'origin', 'target'];
    if (this._selectedNode?.data instanceof HWDFDiagram) {
      this.displayedColumns.push('elements');
    }
    this.displayedColumns.push(...['mitigations', 'status']);
    this.RefreshThreats();
  }
  @Input() public set selectedObject(val: ViewElementBase) {
    if (val && this._selectedObject?.ID == val.ID) return;
    this._selectedObject = val;
    this.selectedThreats = this.ThreatMappings.filter(x => x.Targets.includes(val));
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
        this.dataService.Project?.ThreatMappingsChanged.subscribe(x => { 
          if (x.Type == DataChangedTypes.Added) {
            if (!this.dataService.Project.GetThreatMapping(x.ID).IsGenerated) onDataChanged();
          }
          this.mitigationMappingCounts = {};
        });
        this.dataService.Project?.MitigationMappingsChanged.subscribe(x => this.mitigationMappingCounts = {});
      }, 1000);
    }
  }

  ngOnInit(): void {
  }

  public RefreshThreats() {
    setTimeout(() => {
      this.ThreatMappings = [];
    if (this._selectedNode?.data) {
      if (this._selectedNode?.data instanceof Diagram) {
        this.ThreatMappings = this.threatEngine.GenerateDiagramThreats(this._selectedNode.data);
      }
      else if (this._selectedNode?.data instanceof MyComponentStack) {
        this.ThreatMappings = this.threatEngine.GenerateStackThreats(this._selectedNode.data);
      }
    }

    this.threatCountChanged.emit(this.ThreatMappings.length);
    
    this.isCalculatingThreats = false;
    }, 10);
  }

  public OnMappingDblClick(entry: ThreatMapping, event) {
    if (event && event.target && this.displayedColumns[event.target.cellIndex] == 'mitigations' && this.dataService.Project.GetMitigationMappings().filter(x => x.ThreatMappings.includes(entry)).length  > 0) {
      this.OnViewMitigations(entry);
    }
    else {
      this.dialog.OpenThreatMappingDialog(entry, false);
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

  public IsThreatRemoved(threat: ThreatMapping) {
    return threat.MappingState == MappingStates.Removed;
  }

  public IsThreatNotApplying(threat: ThreatMapping) {
    return threat.ThreatState == ThreatStates.NotApplicable;
  }

  public SelectThreat(threat) {
    this.selectedThreats = [threat];

    if (threat.Target) this.selectedObjectChanged.emit(threat.Target);
  }

  public AddMitigation(entry: ThreatMapping) {
    let map = this.dataService.Project.CreateMitigationMapping(this.selectedNode.data['ID']);
    map.SetMapping(null, entry.Targets, [entry]);
    map.IsGenerated = false;
    let elements: ViewElementBase[] = [];
    if (this.selectedNode.data instanceof Diagram) elements = this.selectedNode.data.Elements.GetChildrenFlat();
    else if (this.selectedNode.data instanceof MyComponentStack) elements = this.selectedNode.data.GetChildrenFlat();
    this.dialog.OpenMitigationMappingDialog(map, true, elements).subscribe(result => {
      if (!result) {
        this.dataService.Project.DeleteMitigationMapping(map);
      }
    });
  }

  public AddExistingMitigation(entry: ThreatMapping, mit: MitigationMapping) {
    mit.AddThreatMapping(entry);
    this.mitigationMappingCounts[entry.ID] = null;
    if (entry.Target) mit.AddTarget(entry.Target);
  }

  public GetPossibleMitigations(entry: ThreatMapping) {
    return this.dataService.Project.GetMitigationMappings().filter(x => !x.ThreatMappings.includes(entry));
  }

  public OnViewMitigations(entry: ThreatMapping) {
    this.dataService.Project.GetMitigationMappings().filter(x => x.ThreatMappings.includes(entry)).forEach(x => {
      this.dialog.OpenMitigationMappingDialog(x, false, null);
    });
  }

  public OnDeleteMapping(entry: ThreatMapping) {
    this.dataService.Project.DeleteThreatMapping(entry);
    this.RefreshThreats();
  }

  public ResetNumbers() {
    const maps = this.dataService.Project.GetThreatMappings().sort((a, b) => {
      return Number(a.Number) - Number(b.Number);
    });

    for (let i = 0; i < maps.length; i++) {
      maps[i].Number = (i+1).toString();
    }
  }

  public OpenContextMenu(event, entry: ThreatMapping) {
    event.preventDefault();

    this.menuTopLeftPosition.x = event.clientX + 'px'; 
    this.menuTopLeftPosition.y = event.clientY + 'px'; 

    this.matMenuTrigger.menuData = { item: entry }; 
    this.matMenuTrigger.openMenu(); 
  }

  public GetStateIcon(entry: ThreatMapping) {
    if (entry.MappingState == MappingStates.New) return 'add';
    if (entry.MappingState == MappingStates.Removed) return 'remove';
    return '';
  }

  public GetCreationTypeIcon(entry: ThreatMapping) {
    if (entry.IsGenerated) return 'settings_suggest';
    else return 'handyman';
  }

  public GetCreationTypeIconTooltip(entry: ThreatMapping) {
    if (entry.IsGenerated) return 'general.Generated';
    else return 'general.Manual';
  }

  public GetThreatCategories(entry: ThreatMapping) {
    return entry.ThreatCategories.map(x => x.Name).join(', ');
  }

  public GetTargets(entry: ThreatMapping) {
    return entry.Targets.map(x => x.GetProperty('Name')).join(', ');
  }

  public GetMitigations(entry: ThreatMapping) {
    if (this.mitigationMappingCounts[entry.ID] == null) {
      const count = this.dataService.Project.GetMitigationMappings().filter(x => x.ThreatMappings.includes(entry)).length;
      if (count == 0) this.mitigationMappingCounts[entry.ID] = this.translate.instant('pages.modeling.threattable.noMitigation');
      else this.mitigationMappingCounts[entry.ID] = count.toString() + ' ' + this.translate.instant('pages.modeling.threattable.mitigations');
    } 

    return this.mitigationMappingCounts[entry.ID];
  }

  public GetThreatStates() {
    return ThreatStateUtil.GetThreatStates();
  }

  public GetThreatStateName(ts: ThreatStates) {
    return ThreatStateUtil.ToString(ts);
  }
}
