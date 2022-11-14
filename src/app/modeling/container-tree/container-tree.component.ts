import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { Subscription } from 'rxjs';
import { IContainer, ViewElementBase } from '../../model/database';
import { DataFlow } from '../../model/dfd-model';
import { DataService } from '../../util/data.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-container-tree',
  templateUrl: './container-tree.component.html',
  styleUrls: ['./container-tree.component.scss']
})
export class ContainerTreeComponent implements OnInit {

  private subscription: Subscription;
  private _elements: IContainer;
  private infoMap = new Map<string, string>();
  private threatMap = new Map<string, number>();

  private isContainer(arg: any): arg is IContainer {
    return arg && arg.GetChildren && typeof(arg.GetChildren) == 'function';
  }

  public treeControl = new NestedTreeControl<ViewElementBase>(node => {
    if (this.isContainer(node)) return node.GetChildren();
    else null;
  });
  public dataSource = new MatTreeNestedDataSource<ViewElementBase>();

  public get elements(): IContainer { return this._elements; }
  @Input()
  public set elements(val: IContainer) { 
    this._elements = val;
    this.selectedElement = null;
    this.RefreshTree();
  };

  @Input()
  public selectedElement: ViewElementBase;

  @Output()
  public selectionChanged = new EventEmitter<ViewElementBase>();

  constructor(public dataService: DataService, public theme: ThemeService) {
  }

  ngOnInit(): void {
    this.dataService.Project.AttackScenariosChanged.subscribe(x => this.threatMap = new Map<string, number>());
    this.RefreshTree();
  }

  public GetNodeInfo(node: ViewElementBase) {
    if (this.infoMap.has(node.ID)) return this.infoMap.get(node.ID);

    if (node instanceof DataFlow && node.Sender && node.Receiver && !node.ShowName) {
      return '(' + node.Sender?.GetProperty('Name') + '->' + node.Receiver?.GetProperty('Name') + ')';
    }
    else {
      this.infoMap.set(node.ID, '');
    }

    return '';
  }

  public GetNodeThreats(node: ViewElementBase): number {
    if (this.threatMap.has(node.ID)) return this.threatMap.get(node.ID);

    const count = this.dataService.Project.GetAttackScenarios().filter(x => x.Target == node || (x.Targets?.includes(node))).length;
    this.threatMap.set(node.ID, count);
    return count;
  }

  public RefreshTree() {
    this.dataSource.data = null;
    if (this.elements) {
      this.dataSource.data = [this.elements as any as ViewElementBase];
      if (this.subscription) this.subscription.unsubscribe();
      this.subscription = this.elements.ChildrenChanged.subscribe(x => {
        this.RefreshTree()
      });

      this.dataSource.data.forEach(x => this.treeControl.expandDescendants(x));
    }
  }

  public OnNodeClicked(node: ViewElementBase) {
    if (node != this.elements as any as ViewElementBase) {
      this.selectedElement = node;
      this.selectionChanged?.emit(node);
    }
  }

  public isSelected(node: ViewElementBase) { return this.selectedElement?.ID == node?.ID; }
  public hasChild = (_: number, node: ViewElementBase) => (this.isContainer(node) && node.GetChildren().length > 0);
}
