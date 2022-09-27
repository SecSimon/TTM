import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { ThemeService } from '../../../util/theme.service';
import { NavTreeBase } from './nav-tree-base';

export interface INavigationNode {
  name: () => string;
  canCheck?: boolean;
  checkEnabled?: boolean;
  isChecked?: boolean;
  canSelect: boolean;
  isExpanded?: boolean;
  children?: INavigationNode[];
  icon?: string;
  iconAlignLeft?: boolean;
  canRename?: boolean;
  isRenaming?: boolean;
  onRename?(val: string);
  canAdd?: boolean;
  addOptions?: string[];
  onAdd?(val?: string);
  canDelete?: boolean;
  onDelete?();
  canDuplicate?: boolean;
  onDuplicate?();
  canMoveUpDown?: boolean;
  onMoveUp?();
  onMoveDown?();
  canMoveToGroup?: boolean;
  onMoveToGroups?();
  onMoveToGroup?(group);
  isBold?: boolean;
  isInactive?: () => boolean;
  data?: any;
  dataType?: any;
}

@Component({
  selector: 'app-nav-tree',
  templateUrl: './nav-tree.component.html',
  styleUrls: ['./nav-tree.component.scss']
})
export class NavTreeComponent implements OnInit {
  private _activeNode: INavigationNode;

  public treeControl = new NestedTreeControl<INavigationNode>(node => node.children);
  public dataSource = new MatTreeNestedDataSource<INavigationNode>();

  public get activeNode(): INavigationNode { return this._activeNode; }
  @Input()
  public set activeNode(val: INavigationNode) {
    this._activeNode = val;

    this.selectedNodeChanged.emit(val);
    setTimeout(() => {
      document.getElementById('renameBox')?.focus();
    }, 100);
  }

  @Input()
  public checkEnabled: boolean = true;

  @Input()
  public canCheckMultiple: boolean = true;

  @Input()
  public set checkedNodes(val: INavigationNode[]) {
    const nodes = NavTreeBase.FlattenNodes(this.dataSource.data); 
    nodes.forEach(node => {
      node.isChecked = false || val?.some(x => x.data == node.data);
    });
  }

  @Output()
  public selectedNodeChanged = new EventEmitter<INavigationNode>();

  @Output() 
  public checkedNodesChanged = new EventEmitter<INavigationNode[]>();

  @Output()
  public nodeDoubleClicked = new EventEmitter<INavigationNode>();

  constructor(public theme: ThemeService) { }

  ngOnInit(): void {
  }
  
  public menuTopLeftPosition =  {x: '0', y: '0'};
  @ViewChild('ctxMenu') public matMenuTrigger: MatMenuTrigger; 
  public OpenContextMenu(event, node) {
    event.preventDefault();
    this.menuTopLeftPosition.x = event.clientX + 'px'; 
    this.menuTopLeftPosition.y = event.clientY + 'px'; 
    this.matMenuTrigger.menuData = { item: node }; 
    this.matMenuTrigger.openMenu(); 
  }

  public OnMoveUp(node: INavigationNode) {
    node.onMoveUp();
    this.resetDataSource();
  }

  public OnMoveDown(node: INavigationNode) {
    node.onMoveDown();
    this.resetDataSource();
  }

  public OnMoveToGroup(node: INavigationNode, group: INavigationNode) {
    node.onMoveToGroup(group);
  }

  public SetNavTreeData(nodes: INavigationNode[]) {
    this.activeNode = null;
    this.dataSource.data = nodes;
    let flat = NavTreeBase.FlattenNodes(nodes);
    flat.forEach(x => {
      if (x.isExpanded || (x.isExpanded == null && x.children && x.children.length > 0)) {
        x.isExpanded = true;
        this.treeControl.expand(x);
      }
    });
    //this.dataSource.data.forEach(x => this.treeControl.expandDescendants(x));
  }

  public OnNodeClick(node: INavigationNode, event) {
    event.stopPropagation();
    if (!node.canSelect) return;

    this.activeNode = node;
  }

  public OnNodeDoubleClick(node: INavigationNode) {
    if (!node.canSelect) return;
    
    this.nodeDoubleClicked.emit(node);
  }

  public OnNodeChecked(node: INavigationNode) {
    if (!this.canCheckMultiple && !node.isChecked) NavTreeBase.FlattenNodes(this.dataSource.data).forEach(x => x.isChecked = false);
    node.isChecked = !node.isChecked;
    this.checkedNodesChanged.emit(NavTreeBase.FlattenNodes(this.dataSource.data).filter(x => x.isChecked));
  }

  public OnEditName(node: INavigationNode) {
    node.isRenaming = true;
    setTimeout(() => {
      document.getElementById('renameBox')?.focus();
    }, 100);
  }

  public OnRename(event, node: INavigationNode) {
    if (event.key === 'Enter' || event.type === 'focusout') {
      node.isRenaming = false;
      if (node.onRename) node.onRename(event.target['value']);
    }
  }

  private resetDataSource() {
    let data = this.dataSource.data;
    this.dataSource.data = null;
    this.dataSource.data = data;
  }

  public HasChild = (_: number, node: INavigationNode) => !!node.children && node.children.length > 0;
}
