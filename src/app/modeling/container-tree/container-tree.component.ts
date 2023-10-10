import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatNestedTreeNode, MatTreeNestedDataSource, MatTreeNode } from '@angular/material/tree';
import { Subscription } from 'rxjs';
import { IContainer, ViewElementBase } from '../../model/database';
import { DataFlow } from '../../model/dfd-model';
import { DataService } from '../../util/data.service';
import { ThemeService } from '../../util/theme.service';
import { FlowArrowPositions } from '../../model/system-context';
import { LocStorageKeys, LocalStorageService } from '../../util/local-storage.service';

@Component({
  selector: 'app-container-tree',
  templateUrl: './container-tree.component.html',
  styleUrls: ['./container-tree.component.scss']
})
export class ContainerTreeComponent implements OnInit {
  private _selectedElement: ViewElementBase;
  private _filteredElement: ViewElementBase;
  private subscription: Subscription;
  private _elements: IContainer;
  private infoMap = new Map<string, string>();
  private scenarioMap = new Map<string, number>();
  private measureMap = new Map<string, number>();
  private showScenarios: boolean = null;
  private showMeasures: boolean = null;

  private isContainer(arg: any): arg is IContainer {
    return arg && arg.GetChildren && typeof(arg.GetChildren) == 'function';
  }

  public get ShowScenarios(): boolean {
    if (this.showScenarios == null) {
      const res = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_CONTAINERTREE_SHOW_SCEN);
      this.showScenarios = res == 'true' || res == null;
    }
    return this.showScenarios;
  };
  public set ShowScenarios(val: boolean) {
    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_CONTAINERTREE_SHOW_SCEN, String(val));
    this.showScenarios = val;
  }

  public get ShowMeasures(): boolean {
    if (this.showMeasures == null) {
      const res = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_CONTAINERTREE_SHOW_MEAS);
      this.showMeasures = res == 'true' || res == null;
    }
    return this.showMeasures;
  };
  public set ShowMeasures(val: boolean) {
    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_CONTAINERTREE_SHOW_MEAS, String(val));
    this.showMeasures = val;
  }

  public treeControl = new NestedTreeControl<ViewElementBase>(node => {
    if (this.isContainer(node)) return node.GetChildren();
    else null;
  });
  public dataSource = new MatTreeNestedDataSource<ViewElementBase>();

  public searchString: string = null;
  public get keepTreeStructure(): boolean {
    const res = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_CONTAINERTREE_KEEP_STRUC);
    return res == 'true' || res == null;
  };
  public set keepTreeStructure(val: boolean) {
    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_CONTAINERTREE_KEEP_STRUC, String(val));
  }

  public get elements(): IContainer { return this._elements; }
  @Input()
  public set elements(val: IContainer) { 
    this._elements = val;
    this.selectedElement = this.filteredElement = null;
    if (this.searchString != null) this.searchString = '';
    this.RefreshTree();
  };

  public get selectedElement(): ViewElementBase { return this._selectedElement; }
  @Input()
  public set selectedElement(val: ViewElementBase) {
    this._selectedElement = val;
    if (val) {
      let node = this.leafNodes.find(x => x.nativeElement.id === val.ID);
      if (!node) node = this.nestedNodes.find(x => x.nativeElement.id === val.ID);
      node?.nativeElement.scrollIntoView({block: 'center', behavior: 'smooth'});
    }
  }

  public get filteredElement(): ViewElementBase {
    return this._filteredElement;
  }
  @Input()
  public set filteredElement(val: ViewElementBase) {
    this._filteredElement = val;
    this.filterChanged.emit(val);
  }

  @Output()
  public selectionChanged = new EventEmitter<ViewElementBase>();

  @Output()
  public filterChanged = new EventEmitter<ViewElementBase>();

  @ViewChild('search', { static: false })
  public set input(element: ElementRef<HTMLInputElement>) {
    if(element) {
      setTimeout(() => { element.nativeElement.focus(); });
    }
  }

  @ViewChildren(MatTreeNode, {read: ElementRef}) leafNodes!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren(MatNestedTreeNode, {read: ElementRef}) nestedNodes!: QueryList<ElementRef<HTMLElement>>;

  constructor(public dataService: DataService, public theme: ThemeService, private locStorage: LocalStorageService) {
  }

  ngOnInit(): void {
    this.dataService.Project.AttackScenariosChanged.subscribe(x => this.scenarioMap = new Map<string, number>());
    this.dataService.Project.CountermeasuresChanged.subscribe(x => this.measureMap = new Map<string, number>());
    this.RefreshTree();
  }

  public GetNodeInfo(node: ViewElementBase) {
    if (this.infoMap.has(node.ID)) return this.infoMap.get(node.ID);

    if (node instanceof DataFlow && node.Sender && node.Receiver) {
      if (!node.ShowName) {
        let arrow = '→';
        if (node.ArrowPos == FlowArrowPositions.Both) arrow = '↔';
        else if (node.ArrowPos == FlowArrowPositions.Start) arrow = '←';
        return '(' + node.Sender?.GetProperty('Name') + arrow + node.Receiver?.GetProperty('Name') + ')';
      }
    }
    else {
      this.infoMap.set(node.ID, '');
    }

    return '';
  }

  public GetNodeScenarios(node: ViewElementBase): number {
    if (this.scenarioMap.has(node.ID)) return this.scenarioMap.get(node.ID);

    const count = this.dataService.Project.GetAttackScenariosApplicable().filter(x => x.Target == node || (x.Targets?.includes(node))).length;
    this.scenarioMap.set(node.ID, count);
    return count;
  }

  public GetNodeMeasures(node: ViewElementBase): number {
    if (this.measureMap.has(node.ID)) return this.measureMap.get(node.ID);

    const count = this.dataService.Project.GetCountermeasuresApplicable().filter(x => x.Targets.includes(node)).length;
    this.measureMap.set(node.ID, count);
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

  public hideLeafNode(node: ViewElementBase): boolean {
    return new RegExp(this.searchString, 'i').test(node.GetProperty('Name')) === false;
  }

  public hideParentNode(node: ViewElementBase): boolean {
    return this.hideLeafNode(node) && (!this.keepTreeStructure || this.treeControl.getDescendants(node).every(node => this.hideLeafNode(node)));
    // return this.hideLeafNode(node) && this.treeControl.getDescendants(node).filter(node => this.isContainer(node)).every(node => this.hideLeafNode(node));
  }

  public isSelected(node: ViewElementBase) { return this.selectedElement?.ID == node?.ID; }
  public hasChild = (_: number, node: ViewElementBase) => (this.isContainer(node) && node.GetChildren().length > 0);
}
