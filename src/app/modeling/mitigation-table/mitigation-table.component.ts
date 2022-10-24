import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MyComponentStack } from '../../model/component';
import { ViewElementBase } from '../../model/database';
import { Diagram } from '../../model/diagram';
import { MitigationMapping, MitigationProcess, MitigationStates, MitigationStateUtil } from '../../model/mitigations';
import { MappingStates } from '../../model/threat-model';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { MitigationEngineService } from '../../util/mitigation-engine.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-mitigation-table',
  templateUrl: './mitigation-table.component.html',
  styleUrls: ['./mitigation-table.component.scss']
})
export class MitigationTableComponent implements OnInit {
  private changesCounter = 0;
  private isCalculatingMitigations = false;
  private _selectedNode: INavigationNode;
  private _selectedObject: ViewElementBase;
  private _mitigationMappings: MitigationMapping[] = [];
  private _selectedMitigations: MitigationMapping[] = [];

  public displayedColumns = [];
  public dataSourceActive: MatTableDataSource<MitigationMapping>;
  public dataSourceNA: MatTableDataSource<MitigationMapping>;
  public autoRefreshMitigations = true;
  public get refreshingMitigations(): boolean {
    return this.changesCounter > 0 || this.isCalculatingMitigations;
  }

  public menuTopLeftPosition =  {x: '0', y: '0'};
  @ViewChild(MatMenuTrigger) public matMenuTrigger: MatMenuTrigger; 
  
  public get MitigationMappings(): MitigationMapping[] { return this._mitigationMappings; }
  public set MitigationMappings(val: MitigationMapping[]) {
    this._mitigationMappings = val;
    let mySort = (data: MitigationMapping, sortHeaderId: string) => {
      if (sortHeaderId == 'name') return data.Name;
      if (sortHeaderId == 'number') return Number(data.Number);
      if (sortHeaderId == 'state') return data.MappingState; 
      if (sortHeaderId == 'type') return data.IsGenerated ? 1 : 0; 
      if (sortHeaderId == 'mitigation') return data.Mitigation.Name;
      if (sortHeaderId == 'origins') return this.GetThreatOrigins(data);
      if (sortHeaderId == 'status') return data.MappingState;  
      if (sortHeaderId == 'targets') return this.GetTargets(data);
      console.error('Missing sorting header'); 
    };
    let myFilter = (data: MitigationMapping, filter: string) => {
      let search = filter.trim().toLowerCase();
      let res = data.Name.toLowerCase().indexOf(search);
      if (res == -1) res = data.Mitigation.Name.toLowerCase().indexOf(search);
      if (res == -1) res = this.GetThreatOrigins(data).toLowerCase().indexOf(search);
      if (res == -1) res = this.GetTargets(data).toLowerCase().indexOf(search);
      return res != -1;
    };

    this.dataSourceActive = new MatTableDataSource(val.filter(x => x.MitigationState != MitigationStates.NotApplicable));
    this.dataSourceActive.sort = this.sort;
    this.dataSourceActive.sortingDataAccessor = mySort;
    this.dataSourceActive.filterPredicate = myFilter;

    this.dataSourceNA = new MatTableDataSource(val.filter(x => x.MitigationState == MitigationStates.NotApplicable));
    this.dataSourceNA.sort = this.sort;
    this.dataSourceNA.sortingDataAccessor = mySort;
    this.dataSourceNA.filterPredicate = myFilter;

    if (this.sort) this.sort.sortChange.emit(this.sort);
  }
  public get selectedMitigations(): MitigationMapping[] { return this._selectedMitigations; }
  public set selectedMitigations(val: MitigationMapping[]) {
    if (val.length == this._selectedMitigations.length) {
      if (val.every(x => this._selectedMitigations.some(y => y.ID == x.ID))) return;
    }
    this._selectedMitigations = val;
  } 

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  @Input() public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
    this.displayedColumns = ['state', 'number', 'type', 'name', 'mitigation', 'origins', 'targets', 'progress', 'status'];
    this.RefreshMitigations();
  }
  @Input() public set selectedObject(val: ViewElementBase) {
    if (val && this._selectedObject?.ID == val.ID) return;
    this._selectedObject = val;
    this.selectedMitigations = this.MitigationMappings.filter(x => x.Targets.includes(val));
  }
  @Output() public selectedObjectChanged = new EventEmitter<ViewElementBase>();

  @Output() public mitigationCountChanged = new EventEmitter<number>();
  
  @ViewChild(MatSort) sort: MatSort;

  constructor(public theme: ThemeService, public dataService: DataService, private mitigationEngine: MitigationEngineService, private dialog: DialogService) { 
    let onDataChanged = () => {
      if (this.autoRefreshMitigations) {
        if (this.changesCounter == 0) {
          setTimeout(() => {
            this.isCalculatingMitigations = true;
            this.changesCounter++;
          }, 10);
        }
        else { this.changesCounter++; }
        setTimeout(() => {
          this.changesCounter--;
          if (this.changesCounter == 0) {
            this.RefreshMitigations();
          }
        }, 500);
      }
    };
    if (this.dataService.Project) {
      setTimeout(() => {
        this.dataService.Project?.MitigationMappingsChanged.subscribe(x => onDataChanged());
        this.dataService.Project?.ThreatMappingsChanged.subscribe(x => onDataChanged());
      }, 1000);
    }
  }

  ngOnInit(): void {
  }

  public RefreshMitigations() {
    setTimeout(() => {
      this.MitigationMappings = [];
    if (this._selectedNode?.data) {
      if (this._selectedNode?.data instanceof Diagram) {
        this.MitigationMappings = this.mitigationEngine.GenerateDiagramMitigations(this._selectedNode.data);
      }
      else if (this._selectedNode?.data instanceof MyComponentStack) {
        this.MitigationMappings = this.mitigationEngine.GenerateStackMitigations(this._selectedNode.data);
      }
    }

    this.mitigationCountChanged.emit(this.MitigationMappings.length);
    
    this.isCalculatingMitigations = false;
    }, 10);
  }

  public OnMappingDblClick(entry: MitigationMapping, event) {
    if (event && event.target && this.displayedColumns[event.target.cellIndex] == 'progress' && entry.MitigationProcess) {
      this.ViewMitigationProcess(entry);
    }
    else {
      let elements: ViewElementBase[] = null;
      if (this.selectedNode.data instanceof Diagram) elements = this.selectedNode.data.Elements.GetChildrenFlat();
      else if (this.selectedNode.data instanceof MyComponentStack) elements = this.selectedNode.data.GetChildrenFlat();
      this.dialog.OpenMitigationMappingDialog(entry, false, elements);
    }
  }

  public ApplyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceActive.filter = filterValue.trim().toLowerCase();
    this.dataSourceNA.filter = filterValue.trim().toLowerCase();
  }

  public IsMitigationSelected(mit) {
    return this.selectedMitigations.includes(mit);
  }

  public IsMitigationRemoved(mit: MitigationMapping) {
    return mit.MappingState == MappingStates.Removed;
  }

  public IsMitigationNotApplying(mit: MitigationMapping) {
    return mit.MitigationState == MitigationStates.NotApplicable;
  }

  public SelectMitigation(mit: MitigationMapping) {
    this.selectedMitigations = [mit];

    if (mit.Targets?.length > 0) this.selectedObjectChanged.emit(mit.Targets[0]);
  }

  public OnDeleteMapping(entry: MitigationMapping) {
    this.dataService.Project.DeleteMitigationMapping(entry);
    this.RefreshMitigations();
  }

  public ResetNumbers() {
    const maps = this.dataService.Project.GetMitigationMappings().sort((a, b) => {
      return Number(a.Number) - Number(b.Number);
    });

    for (let i = 0; i < maps.length; i++) {
      maps[i].Number = (i+1).toString();
    }
  }

  public ViewMitigationProcess(entry: MitigationMapping) {
    this.dialog.OpenMitigationProcessDialog(entry.MitigationProcess, false);
  }

  public AddMitigationProcess(entry: MitigationMapping) {
    let proc = this.dataService.Project.CreateMitigationProcess();
    entry.MitigationProcess = proc;
    this.dialog.OpenMitigationProcessDialog(proc, true).subscribe(res => {
      if (!res) {
        this.dataService.Project.DeleteMitigationProcess(proc);
      }
    });
  }

  public GetPossibleMitigationProcesses(entry: MitigationMapping) {
    return this.dataService.Project.GetMitigationProcesses().filter(x => x != entry.MitigationProcess);
  }

  public AddExistingMitigationProcess(entry: MitigationMapping, proc: MitigationProcess) {
    entry.MitigationProcess = proc;
  }

  public OpenContextMenu(event, entry: MitigationMapping) {
    event.preventDefault();

    this.menuTopLeftPosition.x = event.clientX + 'px'; 
    this.menuTopLeftPosition.y = event.clientY + 'px'; 

    this.matMenuTrigger.menuData = { item: entry }; 
    this.matMenuTrigger.openMenu(); 
  }

  public GetStateIcon(entry: MitigationMapping) {
    if (entry.MappingState == MappingStates.New) return 'add';
    if (entry.MappingState == MappingStates.Removed) return 'remove';
    return '';
  }

  public GetCreationTypeIcon(entry: MitigationMapping) {
    if (entry.IsGenerated) return 'settings_suggest';
    else return 'handyman';
  }

  public GetCreationTypeIconTooltip(entry: MitigationMapping) {
    if (entry.IsGenerated) return 'general.Generated';
    else return 'general.Manual';
  }

  public GetThreatOrigins(entry: MitigationMapping) {
    return entry.ThreatOrigins.map(x => x.GetProperty('Name')).join(', ');
  }

  public GetTargets(entry: MitigationMapping) {
    return entry.Targets.filter(x => x).map(x => x.GetProperty('Name')).join(', ');
  }

  public GetMitigationStates() {
    return MitigationStateUtil.GetMitigationStates();
  }

  public GetMitigationStateName(ts: MitigationStates) {
    return MitigationStateUtil.ToString(ts);
  }
}
