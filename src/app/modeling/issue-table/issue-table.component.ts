import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatRow, MatTableDataSource } from '@angular/material/table';
import { MyComponentStack } from '../../model/component';
import { ViewElementBase } from '../../model/database';
import { HWDFDiagram } from '../../model/diagram';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { DFDCopService, DFDIssueTypes, DFDRuleTypes, IDFDIssue } from '../../util/dfd-cop.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-issue-table',
  templateUrl: './issue-table.component.html',
  styleUrls: ['./issue-table.component.scss']
})
export class IssueTableComponent implements OnInit {
  private changesCounter = 0;
  private isCalculatingIssues = false;
  private _selectedNode: INavigationNode;
  private _selectedObject: ViewElementBase;
  private _filteredObject: ViewElementBase;
  private _issues: IDFDIssue[] = [];
  private _selectedIssue: IDFDIssue;

  public displayedColumns = [];
  public dataSource: MatTableDataSource<IDFDIssue>;

  public get selectedIssue(): IDFDIssue { return this._selectedIssue; }
  public set selectedIssue(val: IDFDIssue) { this._selectedIssue = val; } 

  @Input() public isActive: boolean;

  @Input() public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
    this.displayedColumns = ['type', 'rule', 'element'];
    this.RefreshIssues();
  }
  public get selectedObject(): ViewElementBase { return this._selectedObject; }
  @Input() public set selectedObject(val: ViewElementBase) {
    if (val && this._selectedObject?.ID == val.ID) return;
    this._selectedObject = val;
  }
  @Input() public set filteredObject(val: ViewElementBase) {
    this._filteredObject = val;
    this.RefreshIssues();
  }
  @Output() public selectedObjectChanged = new EventEmitter<ViewElementBase>();

  @Output() public issueCountChanged = new EventEmitter<number>();

  public get Issues(): IDFDIssue[] { return this._issues; }
  public set Issues(val: IDFDIssue[]) {
    if (this._filteredObject) val = val.filter(x => x.Element == this._filteredObject);
    this._issues = val;
    this.dataSource = new MatTableDataSource(val);
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (data: IDFDIssue, sortHeaderId: string) => {
      if (sortHeaderId == 'type') return data.Type;
      if (sortHeaderId == 'rule') return data.RuleType; 
      if (sortHeaderId == 'element') return data.Element?.Name 
      console.error('Missing sorting header'); 
    }

    if (this.sort) this.sort.sortChange.emit(this.sort);
  }

  @ViewChild(MatSort) sort: MatSort;

  @ViewChildren(MatRow, {read: ElementRef}) rows!: QueryList<ElementRef<HTMLTableRowElement>>;

  constructor(public theme: ThemeService, public dataService: DataService, private dfdCop: DFDCopService) {
    let onDataChanged = () => {
      if (this.changesCounter == 0) {
        setTimeout(() => {
          this.isCalculatingIssues = true;
          this.changesCounter++;
        }, 10);
      }
      else { this.changesCounter++; }
      setTimeout(() => {
        this.changesCounter--;
        if (this.changesCounter == 0) {
          this.RefreshIssues();
        }
      }, 3000);
    };
    if (this.dataService.Project) {
      setTimeout(() => {
        this.dataService.Project?.DFDElementsChanged.subscribe(x => onDataChanged());
      }, 1000);
    }
  }

  ngOnInit(): void {
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (!this.isActive || document.activeElement?.tagName == 'TEXTAREA') return;

    if (this.selectedIssue) {
      const selectIssue = (cases, index: number) => {
        this.SelectIssue(cases[index]);
        const r = this.rows.find(row => row.nativeElement.id === cases[index].ID);
        r?.nativeElement.scrollIntoView({block: 'center', behavior: 'smooth'});
      };

      if (event.key == 'ArrowDown') {
        const issues = this.dataSource.sortData(this.dataSource.filteredData, this.sort);
        const currIdx = issues.indexOf(this.selectedIssue);
        if (currIdx < issues.length-1) {
          selectIssue(issues, currIdx+1);
        }
      }
      else if (event.key == 'ArrowUp') {
        const issues = this.dataSource.sortData(this.dataSource.filteredData, this.sort);
        const currIdx = issues.indexOf(this.selectedIssue);
        if (currIdx > 0) {
          selectIssue(issues, currIdx-1);
        }
      }
    }

    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  public RefreshIssues() {
    if (this._selectedNode?.data) {
      if (this._selectedNode?.data instanceof HWDFDiagram) {
        this.Issues = this.dfdCop.CheckDFDRules(this._selectedNode.data);
      }
      else if (this._selectedNode?.data instanceof MyComponentStack) {
        //this.Issues = this.dfdCop.CheckDFDRules(this._selectedNode.data);
      }
    }
    else {
      this.Issues = [];
    }

    setTimeout(() => {
      this.issueCountChanged.emit(this.Issues.length);
    }, 10);
    
    this.isCalculatingIssues = false;
  }

  public SelectIssue(issue: IDFDIssue) {
    this.selectedIssue = issue;

    if (issue.Element) this.selectedObjectChanged.emit(issue.Element);
    //else if (threat.Target instanceof MyComponent) this.selectedComponentChanged.emit(threat.Target);
  }

  public IsIssueSelected(issue) {
    return this.selectedIssue == issue;
  }

  public IsElementSelected(issue: IDFDIssue) {
    return issue && this.selectedObject && issue.Element == this.selectedObject;
  }

  public GetRule(entry: IDFDIssue) {

    switch (entry.RuleType) {
      case DFDRuleTypes.AtLeastOneDF: return 'pages.modeling.issuetable.atLeastOneDF';
      case DFDRuleTypes.DFconnectsP: return 'pages.modeling.issuetable.DFconnectsP';
      case DFDRuleTypes.IFNotUsed: return 'pages.modeling.issuetable.IFNotUsed';
      case DFDRuleTypes.TooManyProcesses: return 'pages.modeling.issuetable.TooManyProcesses';
      default: return entry.RuleType;
    }
  }

  public GetTypeIcon(entry: IDFDIssue) {
    if (entry.Type == DFDIssueTypes.Info) return 'info';
    else if (entry.Type == DFDIssueTypes.Warning) return 'warning';
    else if (entry.Type == DFDIssueTypes.Error) return 'error';
  }
}
