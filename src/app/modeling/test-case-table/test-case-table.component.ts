import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
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
  private testCases: TestCase[] = [];
  private _selectedTestCases: TestCase[] = [];

  public autoRefreshTestCases = true;
  public get refreshingTestCases(): boolean {
    return this.changesCounter > 0 || this.isCalculatingTestCases;
  }

  public displayedColumns = ['number', 'name', 'status', 'elements', 'description'];
  public dataSource: MatTableDataSource<TestCase>;

  public get selectedTestCases(): TestCase[] { return this._selectedTestCases; }
  public set selectedTestCases(val: TestCase[]) {
    if (val.length == this._selectedTestCases.length) {
      if (val.every(x => this._selectedTestCases.includes(x))) return;
    }
    this._selectedTestCases = val;
  } 

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  @Input() public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
    this.RefreshTestCases();
  }
  @Input() public set selectedObject(val: ViewElementBase) {
    if (val && this._selectedObject?.ID == val.ID) return;
    this._selectedObject = val;
    this.selectedTestCases = this.TestCases.filter(x => this.GetElements(x).includes(val));
  }
  @Output() public selectedObjectChanged = new EventEmitter<ViewElementBase>();

  @Output() public testCaseCountChanged = new EventEmitter<number>();

  public get TestCases(): TestCase[] { return this.testCases; }
  public set TestCases(val: TestCase[]) {
    this.testCases = val;
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
    this.selectedTestCases = [tc];

    const elements = this.GetElements(tc);
    if (elements?.length > 0) this.selectedObjectChanged.emit(elements[0]);
  }

  public OpenTestCase(tc: TestCase) {
    this.dialog.OpenTestCaseDialog(tc, false);
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

  public IsTestCaseSelected(issue) {
    return this.selectedTestCases.includes(issue);
  }

  public GetTestCaseStates() {
    return TestCaseStateUtil.GetKeys();
  }

  public GetTestCaseStateName(tcs: TestCaseStates) {
    return TestCaseStateUtil.ToString(tcs);
  }
}
