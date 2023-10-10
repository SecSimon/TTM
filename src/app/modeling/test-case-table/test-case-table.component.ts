import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSort } from '@angular/material/sort';
import { MatRow, MatTableDataSource } from '@angular/material/table';
import { ViewElementBase } from '../../model/database';
import { TestCase, TestCaseStates, TestCaseStateUtil } from '../../model/test-case';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-test-case-table',
  templateUrl: './test-case-table.component.html',
  styleUrls: ['./test-case-table.component.scss']
})
export class TestCaseTableComponent implements OnInit {
  private changesCounter = 0;
  private isCalculatingTestCases = false;
  private _selectedNode: INavigationNode;
  private _selectedObject: ViewElementBase;
  private _filteredObject: ViewElementBase;
  private _testCases: TestCase[] = [];
  private _selectedTestCase: TestCase;

  public autoRefreshTestCases = true;
  public get refreshingTestCases(): boolean {
    return this.changesCounter > 0 || this.isCalculatingTestCases;
  }

  public displayedColumns = ['number', 'name', 'status', 'elements', 'description', 'more'];
  public dataSource: MatTableDataSource<TestCase>;

  public get selectedTestCase(): TestCase { return this._selectedTestCase; }
  public set selectedTestCase(val: TestCase) { this._selectedTestCase = val; } 

  @Input() public isActive: boolean;

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  @Input() public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
    this.RefreshTestCases();
  }
  public get selectedObject(): ViewElementBase { return this._selectedObject; }
  @Input() public set selectedObject(val: ViewElementBase) {
    if (val && this._selectedObject?.ID == val.ID) return;
    this._selectedObject = val;
  }
  @Input() public set filteredObject(val: ViewElementBase) {
    this._filteredObject = val;
    this.RefreshTestCases();
  }
  @Output() public selectedObjectChanged = new EventEmitter<ViewElementBase>();

  @Output() public testCaseCountChanged = new EventEmitter<number>();

  public get TestCases(): TestCase[] { return this._testCases; }
  public set TestCases(val: TestCase[]) {
    if (this._filteredObject) val = val.filter(x => x.LinkedElements.includes(this._filteredObject));
    this._testCases = val;
    this.dataSource = new MatTableDataSource(val);
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (data: TestCase, sortHeaderId: string) => {
      if (sortHeaderId == 'number') return Number(data.Number);
      if (sortHeaderId == 'name') return data.Name;
      if (sortHeaderId == 'status') return data.Status;
      if (sortHeaderId == 'elements') return this.GetElementNames(data);
      if (sortHeaderId == 'description') return data.Description;
      console.error('Missing sorting header'); 
    }

    if (this.sort) this.sort.sortChange.emit(this.sort);
  }

  @ViewChild(MatSort) sort: MatSort;
  public menuTopLeftPosition =  {x: '0', y: '0'};
  @ViewChild(MatMenuTrigger) public matMenuTrigger: MatMenuTrigger; 

  @ViewChildren(MatRow, {read: ElementRef}) rows!: QueryList<ElementRef<HTMLTableRowElement>>;

  constructor(public theme: ThemeService, public dataService: DataService, private dialog: DialogService) {
    const onDataChanged = () => {
      if (this.changesCounter == 0) {
        setTimeout(() => {
          this.isCalculatingTestCases = true;
          this.changesCounter++;
        }, 10);
      }
      else { this.changesCounter++; }
      setTimeout(() => {
        this.changesCounter--;
        if (this.changesCounter == 0) {
          this.RefreshTestCases();
        }
      }, 3000);
    };
    if (this.dataService.Project) {
      setTimeout(() => {
        this.dataService.Project?.TestCasesChanged.subscribe(x => onDataChanged());
      }, 1000);
    }
  }

  ngOnInit(): void {
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (!this.isActive) return;

    if (this.selectedTestCase) {
      const selectCase = (cases, index: number) => {
        this.SelectTestCase(cases[index]);
        const r = this.rows.find(row => row.nativeElement.id === cases[index].ID);
        r?.nativeElement.scrollIntoView({block: 'center', behavior: 'smooth'});
      };

      if (event.key == 'ArrowDown') {
        const cases = this.dataSource.sortData(this.dataSource.filteredData, this.sort);
        const currIdx = cases.indexOf(this.selectedTestCase);
        if (currIdx < cases.length-1) {
          selectCase(cases, currIdx+1);
        }
      }
      else if (event.key == 'ArrowUp') {
        const cases = this.dataSource.sortData(this.dataSource.filteredData, this.sort);
        const currIdx = cases.indexOf(this.selectedTestCase);
        if (currIdx > 0) {
          selectCase(cases, currIdx-1);
        }
      }
    }

    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  public RefreshTestCases() {
    setTimeout(() => {
      this.TestCases = [];
      if (this._selectedNode?.data) {
        this.TestCases = this.dataService.Project.GetTestCases().filter(x => this.GetElements(x).length > 0);
      }

      this.testCaseCountChanged.emit(this.TestCases.length);
      this.isCalculatingTestCases = false;
    }, 10);
  }

  public SelectTestCase(tc: TestCase) {
    this.selectedTestCase = tc;

    const elements = this.GetElements(tc);
    if (elements?.length > 0) this.selectedObjectChanged.emit(elements[0]);
  }

  public OpenTestCase(tc: TestCase) {
    this.dialog.OpenTestCaseDialog(tc, false, this.dataSource.sortData(this.dataSource.filteredData, this.sort));
  }

  public OpenContextMenu(event, entry: TestCase) {
    event.preventDefault();

    this.menuTopLeftPosition.x = event.clientX + 'px'; 
    this.menuTopLeftPosition.y = event.clientY + 'px'; 

    this.matMenuTrigger.menuData = { item: entry }; 
    this.matMenuTrigger.openMenu(); 
  }

  public DeleteTestCase(tc: TestCase) {
    this.dialog.OpenDeleteObjectDialog(tc).subscribe(res => {
      if (res) {
        this.dataService.Project.DeleteTestCase(tc);
        this.RefreshTestCases();
      }
    });
  }

  public GetElements(tc: TestCase): ViewElementBase[] {
    return tc.LinkedElements.filter(x => this.selectedNode?.data?.ID == tc.GetViewOfLinkedElement(x).ID);
  }

  public GetElementNames(tc: TestCase) {
    return this.GetElements(tc).map(x => x.Name).join(', ');
  }

  public IsTestCaseSelected(tc) {
    return this.selectedTestCase == tc;
  }

  public IsElementSelected(tc: TestCase) {
    return tc && this.selectedObject && this.GetElements(tc).includes(this.selectedObject);
  }

  public GetTestCaseStates() {
    return TestCaseStateUtil.GetKeys();
  }

  public GetTestCaseStateName(tcs: TestCaseStates) {
    return TestCaseStateUtil.ToString(tcs);
  }
}
