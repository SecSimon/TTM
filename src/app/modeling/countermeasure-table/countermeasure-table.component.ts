import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSort } from '@angular/material/sort';
import { MatRow, MatTableDataSource } from '@angular/material/table';
import { MyComponentStack } from '../../model/component';
import { ViewElementBase } from '../../model/database';
import { Diagram } from '../../model/diagram';
import { Countermeasure, MitigationProcess, MitigationStates, MitigationStateUtil } from '../../model/mitigations';
import { MappingStates } from '../../model/threat-model';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { MitigationEngineService } from '../../util/mitigation-engine.service';
import { ThemeService } from '../../util/theme.service';
import { StringExtension } from '../../util/string-extension';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-countermeasure-table',
  templateUrl: './countermeasure-table.component.html',
  styleUrls: ['./countermeasure-table.component.scss']
})
export class CountermeasureTableComponent implements OnInit {
  private changesCounter = 0;
  private isCalculatingCountermeasures = false;
  private _selectedNode: INavigationNode;
  private _selectedObject: ViewElementBase;
  private _filteredObject: ViewElementBase;
  private _countermeasures: Countermeasure[] = [];
  private _selectedCountermeasure: Countermeasure;

  public displayedColumns = [];
  public dataSourceActive: MatTableDataSource<Countermeasure>;
  public dataSourceNA: MatTableDataSource<Countermeasure>;
  public autoRefreshCountermeasures = true;
  public get refreshingCountermeasures(): boolean {
    return this.changesCounter > 0 || this.isCalculatingCountermeasures;
  }

  public menuTopLeftPosition =  {x: '0', y: '0'};
  @ViewChild(MatMenuTrigger) public matMenuTrigger: MatMenuTrigger; 

  @ViewChildren(MatRow, {read: ElementRef}) rows!: QueryList<ElementRef<HTMLTableRowElement>>;
  
  public get Countermeasures(): Countermeasure[] { return this._countermeasures; }
  public set Countermeasures(val: Countermeasure[]) {
    if (this._filteredObject) val = val.filter(x => x.Targets.includes(this._filteredObject));
    this._countermeasures = val;
    const mySort = (data: Countermeasure, sortHeaderId: string) => {
      if (sortHeaderId == 'name') return data.Name;
      if (sortHeaderId == 'number') return Number(data.Number);
      if (sortHeaderId == 'state') return data.MappingState; 
      if (sortHeaderId == 'type') return data.IsGenerated ? 1 : 0; 
      if (sortHeaderId == 'control') return data.Control?.Name;
      if (sortHeaderId == 'vectors') return this.GetAttackVectors(data);
      if (sortHeaderId == 'status') return data.MappingState;  
      if (sortHeaderId == 'targets') return this.GetTargets(data);
      console.error('Missing sorting header'); 
    };
    const myFilter = (data: Countermeasure, filter: string) => {
      let search = filter.trim().toLowerCase();
      let res = data.Name.toLowerCase().indexOf(search);
      if (res == -1 && data.Control) res = data.Control.Name.toLowerCase().indexOf(search);
      if (res == -1 && this.GetAttackVectors(data)) res = this.GetAttackVectors(data).toLowerCase().indexOf(search);
      if (res == -1 && this.GetTargets(data)) res = this.GetTargets(data).toLowerCase().indexOf(search);
      return res != -1;
    };

    const actives = val.filter(x => ![MitigationStates.NotApplicable, MitigationStates.Rejected, MitigationStates.Duplicate].includes(x.MitigationState));
    actives.sort((a, b) => { return Number(a.Number) < Number(b.Number) ? -1 : 1; });
    this.dataSourceActive = new MatTableDataSource(actives);
    this.dataSourceActive.sort = this.sort;
    this.dataSourceActive.sortingDataAccessor = mySort;
    this.dataSourceActive.filterPredicate = myFilter;

    const nas = val.filter(x => [MitigationStates.NotApplicable, MitigationStates.Rejected, MitigationStates.Duplicate].includes(x.MitigationState));
    nas.sort((a, b) => { return Number(a.Number) < Number(b.Number) ? -1 : 1; });
    this.dataSourceNA = new MatTableDataSource(nas);
    this.dataSourceNA.sort = this.sort;
    this.dataSourceNA.sortingDataAccessor = mySort;
    this.dataSourceNA.filterPredicate = myFilter;

    if (this.sort) this.sort.sortChange.emit(this.sort);
  }
  public get selectedCountermeasure(): Countermeasure { return this._selectedCountermeasure; }
  public set selectedCountermeasure(val: Countermeasure) { this._selectedCountermeasure = val; } 

  @Input() public isActive: boolean;

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  @Input() public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
    this.displayedColumns = ['state', 'number', 'type', 'name', 'control', 'vectors', 'targets', 'progress', 'status', 'more'];
    this.RefreshCountermeasures();
  }
  public get selectedObject(): ViewElementBase { return this._selectedObject; }
  @Input() public set selectedObject(val: ViewElementBase) {
    if (val && this._selectedObject?.ID == val.ID) return;
    this._selectedObject = val;
  }
  @Input() public set filteredObject(val: ViewElementBase) {
    this._filteredObject = val;
    this.RefreshCountermeasures();
  }
  @Output() public selectedObjectChanged = new EventEmitter<ViewElementBase>();

  @Output() public countermeasureCountChanged = new EventEmitter<number>();
  
  @ViewChild(MatSort) sort: MatSort;

  constructor(public theme: ThemeService, public dataService: DataService, private mitigationEngine: MitigationEngineService, private dialog: DialogService, private translate: TranslateService) { 
    let onDataChanged = () => {
      if (this.autoRefreshCountermeasures) {
        if (this.changesCounter == 0) {
          setTimeout(() => {
            this.isCalculatingCountermeasures = true;
            this.changesCounter++;
          }, 10);
        }
        else { this.changesCounter++; }
        setTimeout(() => {
          this.changesCounter--;
          if (this.changesCounter == 0) {
            this.RefreshCountermeasures();
          }
        }, 500);
      }
    };
    if (this.dataService.Project) {
      setTimeout(() => {
        this.dataService.Project?.CountermeasuresChanged.subscribe(x => onDataChanged());
        this.dataService.Project?.AttackScenariosChanged.subscribe(x => onDataChanged());
      }, 1000);
    }
  }

  ngOnInit(): void {
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (!this.isActive || document.activeElement?.tagName == 'TEXTAREA') return;

    if (this.selectedCountermeasure) {
      const selectMeasure = (measures, index: number) => {
        this.SelectCountermeasure(measures[index]);
        const r = this.rows.find(row => row.nativeElement.id === measures[index].ID);
        r?.nativeElement.scrollIntoView({block: 'center', behavior: 'smooth'});
      };

      if (event.key == 'ArrowDown') {
        const measurres = this.dataSourceActive.sortData(this.dataSourceActive.filteredData, this.sort);
        const currIdx = measurres.indexOf(this.selectedCountermeasure);
        if (currIdx < measurres.length-1) {
          selectMeasure(measurres, currIdx+1);
        }
      }
      else if (event.key == 'ArrowUp') {
        const measures = this.dataSourceActive.sortData(this.dataSourceActive.filteredData, this.sort);
        const currIdx = measures.indexOf(this.selectedCountermeasure);
        if (currIdx > 0) {
          selectMeasure(measures, currIdx-1);
        }
      }
    }

    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  public RefreshCountermeasures() {
    setTimeout(() => {
      this.Countermeasures = [];
      if (this._selectedNode?.data) {
        if (this._selectedNode?.data instanceof Diagram) {
          this.Countermeasures = this.mitigationEngine.GenerateDiagramMitigations(this._selectedNode.data);
        }
        else if (this._selectedNode?.data instanceof MyComponentStack) {
          this.Countermeasures = this.mitigationEngine.GenerateStackMitigations(this._selectedNode.data);
        }
      }

      this.countermeasureCountChanged.emit(this.dataSourceActive.data.length);
      
      this.isCalculatingCountermeasures = false;
    }, 10);
  }

  public OnMappingDblClick(entry: Countermeasure, event) {
    if (event && event.target && this.displayedColumns[event.target.cellIndex] == 'progress' && entry.MitigationProcess) {
      this.ViewMitigationProcess(entry);
    }
    else {
      let elements: ViewElementBase[] = null;
      if (this.selectedNode.data instanceof Diagram) elements = this.selectedNode.data.Elements.GetChildrenFlat();
      else if (this.selectedNode.data instanceof MyComponentStack) elements = this.selectedNode.data.GetChildrenFlat();
      this.dialog.OpenCountermeasureDialog(entry, false, elements, [...this.dataSourceActive.sortData(this.dataSourceActive.filteredData, this.sort), ...this.dataSourceNA.sortData(this.dataSourceNA.filteredData, this.sort)]);
    }
  }

  public ApplyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceActive.filter = filterValue.trim().toLowerCase();
    this.dataSourceNA.filter = filterValue.trim().toLowerCase();
  }

  public IsCountermeasureSelected(mit) {
    return this.selectedCountermeasure == mit;
  }

  public IsCountermeasureRemoved(mit: Countermeasure) {
    return mit.MappingState == MappingStates.Removed;
  }

  public IsCountermeasureNotApplying(mit: Countermeasure) {
    return mit.MitigationState == MitigationStates.NotApplicable;
  }

  public IsCountermeasureRejected(mit: Countermeasure) {
    return mit.MitigationState == MitigationStates.Rejected;
  }

  public IsCountermeasureDuplicated(mit: Countermeasure) {
    return mit.MitigationState == MitigationStates.Duplicate;
  }

  public SelectCountermeasure(mit: Countermeasure) {
    this.selectedCountermeasure = mit;

    if (mit.Targets?.length > 0) this.selectedObjectChanged.emit(mit.Targets[0]);
  }

  public IsElementSelected(cm: Countermeasure) {
    return cm && this.selectedObject && cm.Targets.includes(this.selectedObject);
  }

  public OnDeleteMapping(entry: Countermeasure) {
    this.dataService.Project.DeleteCountermeasure(entry);
    this.RefreshCountermeasures();
  }

  public ResetNumbers() {
    const maps = this.dataService.Project.GetCountermeasures().sort((a, b) => {
      return Number(a.Number) - Number(b.Number);
    });

    for (let i = 0; i < maps.length; i++) {
      maps[i].Number = (i+1).toString();
    }
  }

  public ViewMitigationProcess(entry: Countermeasure) {
    this.dialog.OpenMitigationProcessDialog(entry.MitigationProcess, false);
  }

  public AddMitigationProcess(entry: Countermeasure) {
    let proc = this.dataService.Project.CreateMitigationProcess();
    entry.MitigationProcess = proc;
    this.dialog.OpenMitigationProcessDialog(proc, true).subscribe(res => {
      if (!res) {
        this.dataService.Project.DeleteMitigationProcess(proc);
      }
    });
  }

  public GetPossibleMitigationProcesses(entry: Countermeasure) {
    return this.dataService.Project.GetMitigationProcesses().filter(x => x != entry.MitigationProcess);
  }

  public AddExistingMitigationProcess(entry: Countermeasure, proc: MitigationProcess) {
    entry.MitigationProcess = proc;
  }

  public OpenContextMenu(event, entry: Countermeasure) {
    event.preventDefault();

    this.menuTopLeftPosition.x = event.clientX + 'px'; 
    this.menuTopLeftPosition.y = event.clientY + 'px'; 

    this.matMenuTrigger.menuData = { item: entry }; 
    this.matMenuTrigger.openMenu(); 
  }

  public GetStateIcon(entry: Countermeasure) {
    if (entry.MappingState == MappingStates.New) return 'add';
    if (entry.MappingState == MappingStates.Removed) return 'remove';
    return '';
  }

  public GetCreationTypeIcon(entry: Countermeasure) {
    if (entry.IsGenerated) return 'settings_suggest';
    else return 'handyman';
  }

  public GetCreationTypeIconTooltip(entry: Countermeasure) {
    if (entry.IsGenerated) return 'general.Generated';
    else return 'general.Manual';
  }

  public GetAttackVectors(entry: Countermeasure) {
    return entry.AttackVectors.map(x => x.GetProperty('Name')).join(', ');
  }

  public GetTargets(entry: Countermeasure) {
    return entry.Targets.filter(x => x).map(x => x.GetProperty('Name')).join(', ');
  }

  public GetApplicableCount() {
    return StringExtension.Format(this.translate.instant('pages.modeling.threattable.applicable'), this.dataSourceActive.data.length.toString(), this.Countermeasures.length.toString());
  }

  public GetMitigationStates() {
    return MitigationStateUtil.GetMitigationStates();
  }

  public GetMitigationStateName(ts: MitigationStates) {
    return MitigationStateUtil.ToString(ts);
  }
}
