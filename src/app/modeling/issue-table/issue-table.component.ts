import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
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
  private issues: IDFDIssue[] = [];
  private _selectedIssues: IDFDIssue[] = [];

  public displayedColumns = [];
  public dataSource: MatTableDataSource<IDFDIssue>;

  public get selectedIssues(): IDFDIssue[] { return this._selectedIssues; }
  public set selectedIssues(val: IDFDIssue[]) {
    if (val.length == this._selectedIssues.length) {
      if (val.every(x => this._selectedIssues.some(y => y.Element.ID == x.Element.ID && y.DiagramID == x.DiagramID && y.RuleType == x.RuleType && y.Type == x.Type))) return;
    }
    this._selectedIssues = val;
  } 

  @Input() public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
    this.displayedColumns = ['type', 'rule', 'element'];
    this.RefreshIssues();
  }
  @Input() public set selectedObject(val: ViewElementBase) {
    if (val && this._selectedObject?.ID == val.ID) return;
    this._selectedObject = val;
    this.selectedIssues = this.Issues.filter(x => x.Element.ID == val?.ID);
  }
  @Output() public selectedObjectChanged = new EventEmitter<ViewElementBase>();

  @Output() public issueCountChanged = new EventEmitter<number>();

  public get Issues(): IDFDIssue[] { return this.issues; }
  public set Issues(val: IDFDIssue[]) {
    this.issues = val;
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

  constructor(public theme: ThemeService, private dataService: DataService, private dfdCop: DFDCopService) {
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
    this.selectedIssues = [issue];

    if (issue.Element) this.selectedObjectChanged.emit(issue.Element);
    //else if (threat.Target instanceof MyComponent) this.selectedComponentChanged.emit(threat.Target);
  }

  public IsIssueSelected(issue) {
    return this.selectedIssues.includes(issue);
  }

  public GetRule(entry: IDFDIssue) {

    switch (entry.RuleType) {
      case DFDRuleTypes.AtLeastOneDF: return 'pages.modeling.issuetable.atLeastOneDF';
      case DFDRuleTypes.DFconnectsP: return 'pages.modeling.issuetable.DFconnectsP';
      case DFDRuleTypes.IFNotUsed: return 'pages.modeling.issuetable.IFNotUsed';
      default: return entry.RuleType;
    }
  }

  public GetTypeIcon(entry: IDFDIssue) {
    if (entry.Type == DFDIssueTypes.Info) return 'info';
    else if (entry.Type == DFDIssueTypes.Warning) return 'warning';
    else if (entry.Type == DFDIssueTypes.Error) return 'error';
  }
}
