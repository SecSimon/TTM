import { Component, OnInit, ViewChild } from '@angular/core';
import { ThemeService } from '../util/theme.service';

import { DataService } from '../util/data.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Diagram, DiagramTypes } from '../model/diagram';
import { MyComponent, MyComponentStack } from '../model/component';
import { IContainer, ViewElementBase } from '../model/database';
import { LocalStorageService, LocStorageKeys } from '../util/local-storage.service';
import { DialogService } from '../util/dialog.service';
import { INavigationNode } from '../shared/components/nav-tree/nav-tree.component';
import { StackComponent } from './stack/stack.component';
import { SideNavBase } from '../shared/components/side-nav/side-nav-base';
import { AssetGroup } from '../model/assets';
import { CharScope } from '../model/char-scope';
import { ObjImpact } from '../model/obj-impact';
import { ThreatSources as ThreatSources } from '../model/threat-source';
import { Device, MobileApp } from '../model/system-context';
import { ContainerTreeComponent } from './container-tree/container-tree.component';
import { Checklist } from '../model/checklist';
import { NavTreeBase } from '../shared/components/nav-tree/nav-tree-base';
import { TranslateService } from '@ngx-translate/core';
import { ProjectFile } from '../model/project-file';
import { Testing } from '../model/test-case';

export enum NodeTypes {
  CharScope = 'char-scope',
  ObjImpact = 'obj-impact',
  Context = 'context',
  UseCase = 'use-case',
  Assets = 'asset',
  ThreatSources = 'threat-sources',
  SystemThreats = 'system-threats',
  Hardware = 'hardware',
  Software = 'software',
  Process = 'process',
  Dataflow = 'dataflow',
  Checklist = 'checklist'
}

interface ITabContainer {
  label: string;
  nav: INavigationNode,
  keepOpen: boolean,
  isHovered?: boolean;
}

@Component({
  selector: 'app-modeling',
  templateUrl: './modeling.component.html',
  styleUrls: ['./modeling.component.scss']
})
export class ModelingComponent extends SideNavBase implements OnInit {
  private nodes: INavigationNode[];
  private _selectedObject: any;
  private _filteredObject: ViewElementBase;
  private _selectedTabIndex = 0;

  public get selectedNode(): INavigationNode { 
    if ((this.selectedTabIndex < 0 && this.tabs.length > 0) || (this.selectedTabIndex >= this.tabs.length && this.tabs.length > 0)) {
      console.error('Tab index out of array');
      console.log(this.selectedTabIndex, this.tabs.length);
    }
    return this.tabs[this.selectedTabIndex]?.nav;
  }
  public set selectedNode(val: INavigationNode) {
    setTimeout(() => {
      if (val) this.hasBottomTabGroup = [NodeTypes.Context, NodeTypes.UseCase, NodeTypes.Hardware, NodeTypes.Software, NodeTypes.Process, NodeTypes.Dataflow].includes(val.dataType);
      else this.hasBottomTabGroup = true;
      if (val) this.newTab(val);
    }, 10);
  }

  public tabs: ITabContainer[] = [];
  public get selectedTabIndex() {
    if (this._selectedTabIndex < 0 && this.tabs.length > 0) this._selectedTabIndex = 0; 
    return this._selectedTabIndex; 
  }
  public set selectedTabIndex(val: number) {
    this._selectedTabIndex = val;
    setTimeout(() => {
      if (this.elementView) this.elementView.RefreshTree();
    }, 100);
  }

  public get selectedObject(): any { return this._selectedObject; }
  public set selectedObject(val: any) { 
    this._selectedObject = val; 
  }

  public get filteredObject(): ViewElementBase { return this._filteredObject; }
  public set filteredObject(val: ViewElementBase) { 
    this._filteredObject = val; 
  }

  public get selectedComponent(): MyComponent { return this.selectedObject instanceof MyComponent ? this.selectedObject as MyComponent : null; }

  public hasBottomTabGroup: boolean = true;
  public selectedBottomTabGroupIndex: number = 0;

  public currentThreatCount: number = 0;
  public currentCountermeasureCount: number = 0;
  public currentTestCaseCount: number = 0;
  public currentIssueCount: number = 0;

  @ViewChild('elementview') elementView: ContainerTreeComponent;
  @ViewChild(StackComponent) compStack: StackComponent;

  constructor(public theme: ThemeService, public dataService: DataService, private router: Router, private route: ActivatedRoute,
    private locStorage: LocalStorageService, private dialog: DialogService, private translate: TranslateService) {
      super();
    if (!this.dataService.Project) this.router.navigate(['/']); 

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.route.queryParams.subscribe(params => {
          const openTabByDataType = (tab: string) => {
            const node = NavTreeBase.FlattenNodes(this.nodes).find(x => x.dataType == tab);
            if (node) this.newTab(node);
            this.router.navigate([], { replaceUrl: true, relativeTo: this.route });
          };
          const openTabByViewID = (viewID: string) => {
            const node = NavTreeBase.FlattenNodes(this.nodes).find(x => x.data?.ID == viewID);
            if (node) this.newTab(node);
            this.router.navigate([], { replaceUrl: true, relativeTo: this.route });
          };

          if (params['tab'] != null) {
            if (this.nodes) openTabByDataType(params['tab']);
            else {
              setTimeout(() => {
                if (this.nodes) openTabByDataType(params['tab']);
              }, 500);
            }
          }
          if (params['viewID'] != null) {
            if (this.nodes) openTabByViewID(params['viewID']);
            else {
              setTimeout(() => {
                if (this.nodes) openTabByViewID(params['viewID']);
              }, 500);
            }
          }
          if (params['elementID'] != null) {
            let element: ViewElementBase = this.dataService.Project.GetDFDElement(params['elementID']);
            if (!element) element = this.dataService.Project.GetComponent(params['elementID']);
            if (!element) element = this.dataService.Project.GetContextElement(params['elementID']);
            if (element) setTimeout(() => { this.selectedObject = element; }, 100);
          }
        });
      }
    });

    this.dataService.ProjectChanged.subscribe(p => {
      if (p) {
        setTimeout(() => {
          this.tabs.forEach(x => this.RemoveTab(x));
          this.createNodes();
        }, 10);
      }
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.createNodes();
    }, 100);
  }

  public RemoveTab(tab: ITabContainer) {
    const index = this.tabs.indexOf(tab);
    if (index > -1) {
      let changeTab = this.tabs.indexOf(tab) == this.selectedTabIndex;
      this.tabs.splice(index, 1);
      if (changeTab) this.OnTabIndexChange(index > 0 ? index - 1 : 0);
      else if (index < this.selectedTabIndex) this.selectedTabIndex = this.selectedTabIndex - 1;
    }
  }

  public OnTabIndexChange(event) {
    if (event == this.selectedTabIndex) return; 

    let previousIndex = this.selectedTabIndex;
    this.selectedTabIndex = event;

    this.selectedObject = null;
    this.filteredObject = null;

    if (this.tabs.length > previousIndex && this.tabs[previousIndex] && !this.tabs[previousIndex].keepOpen) {
      setTimeout(() => {
        this.RemoveTab(this.tabs[previousIndex]);
        if (previousIndex < this.selectedTabIndex) this.selectedTabIndex = this.selectedTabIndex - 1;
      }, 500);
    }
  }

  public OnNodeDoubleClicked(node: INavigationNode) {
    let tab = this.tabs.find(x => x.nav == node);
    if (tab) tab.keepOpen = true;
  }

  public GetSplitSize(splitter: number, gutter: number, defaultSize: number) {
    let size = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_SPLIT_SIZE_X + splitter.toString());
    if (size != null) return Number(JSON.parse(size)[gutter]);
    return defaultSize;
  }

  public OnSplitSizeChange(event, splitter: number) {
    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_SPLIT_SIZE_X + splitter.toString(), JSON.stringify(event['sizes']));
  }

  public OnOpenDiagram(data: {diagram: Diagram, element: ViewElementBase}) {
    let node = NavTreeBase.FindNodeOfObject(data.diagram, this.nodes);
    if (!node) {
      this.createNodes();
      node = NavTreeBase.FindNodeOfObject(data.diagram, this.nodes);
    }
    if (node) this.newTab(node);
    if (data.element) {
      setTimeout(() => {
        this.selectedObject = data.element;
      }, 1000);
    }
  }

  public IsCharScope(node: INavigationNode) {
    return node?.data instanceof CharScope;
  }

  public IsObjImpact(node: INavigationNode) {
    return node?.data instanceof ObjImpact;
  }

  public IsThreatSource(node: INavigationNode) {
    return node?.data instanceof ThreatSources;
  }

  public IsThreatIdentification(node: INavigationNode) {
    return node?.dataType == NodeTypes.SystemThreats;
  }

  public IsAssetGroup(node: INavigationNode) {
    return node?.data instanceof AssetGroup;
  }

  public IsDiagram(node: INavigationNode) {
    return node?.data instanceof Diagram;
  }

  public IsMyComponentStack(node: INavigationNode) {
    return node?.data instanceof MyComponentStack;
  }

  public IsChecklist(node: INavigationNode) {
    return node?.data instanceof Checklist;
  }

  public IsModelInfo(node: INavigationNode) {
    return node?.data instanceof ProjectFile;
  }

  public IsTesting(node: INavigationNode) {
    return node?.data instanceof Testing;
  }

  public GetContainer(node: INavigationNode) {
    if (node) {
      if (this.isContainer(node.data)) return node.data;
      if (this.isContainer(node.data?.Elements)) return node.data.Elements;
    }
  }

  public IsContainer(node: INavigationNode) {
    return this.GetContainer(node) != null;
  }

  private isContainer(arg: any): arg is IContainer {
    return arg && arg.GetChildren && typeof(arg.GetChildren) == 'function';
  }

  private newTab(node: INavigationNode) {
    let openTab = this.tabs.find(x => x.nav.data?.ID == node.data?.ID);
    if (openTab) {
      this.OnTabIndexChange(this.tabs.indexOf(openTab));
    }
    else {
      let lbl = this.findParent(node, this.nodes)?.name();
      if (!lbl) lbl = this.dataService.Project.Name; // model info
      this.tabs.push({ label: lbl, keepOpen: false, nav: node });
      setTimeout(() => {
        this.OnTabIndexChange(this.tabs.length-1);
      }, 100);
    }
  }

  private findParent(node: INavigationNode, coll: INavigationNode[]): INavigationNode {
    for (let i = 0; i < coll.length; i++) {
      if (coll[i].children && coll[i].children.includes(node)) return coll[i];
    }
    for (let i = 0; i < coll.length; i++) {
      if (coll[i].children) {
        let parent = this.findParent(node, coll[i].children);
        if (parent) return parent;
      }
    }
    return null;
  }

  public createNodes() {
    const selectedObject = this.selectedNode?.data;
    const prevNodes = this.nodes;
    this.nodes = [];
    const pf = this.dataService.Project;

    const createChecklist = (list: Checklist): INavigationNode => {
      let ch: INavigationNode = {
        name: () => list.Name,
        icon: 'fact_check',
        iconAlignLeft: true,
        canSelect: true,
        data: list,
        dataType: NodeTypes.Checklist,
        canRename: true,
        onRename: (val: string) => { list.Name = val; },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(list).subscribe(res => {
            if (res) {
              this.dataService.Project.DeleteChecklist(list);
              if (this.selectedNode == ch) this.selectedNode = null;
              let tab = this.tabs.find(x => x.nav.data.ID == list.ID);
              if (tab) this.RemoveTab(tab);
              this.createNodes();
            }
          });
        },
      };

      return ch;
    };

    const createDevice = (dev: Device, parentGroupNode: INavigationNode): INavigationNode => {
      let node: INavigationNode = {
        name: () => { return dev.Name },
        canSelect: false,
        data: dev,
        canRename: true,
        onRename: (val: string) => { dev.Name = val; },
        canAdd: true,
        addOptions: [],
        onAdd: (val: string) => {
          if (val == 'Assets') {
            let ag = pf.InitializeNewAssetGroup(pf.Config);
            dev.Data['assetGroupID'] = ag.ID;
            this.createNodes();
            this.selectedNode = NavTreeBase.FindNodeOfObject(ag, this.nodes);
          }
          else if (val == 'Software') {
            let stack = dev.CreateSoftwareStack();
            this.createNodes();
            this.selectedNode = NavTreeBase.FindNodeOfObject(stack, this.nodes);
          }
          else if (val == 'Process') {
            let stack = dev.CreateProcessStack();
            this.createNodes();
            this.selectedNode = NavTreeBase.FindNodeOfObject(stack, this.nodes);
          }
          else {
            let type = this.dataService.Config.GetChecklistTypes().find(x => x.Name == val.replace(this.translate.instant('general.Checklist') + ': ', ''));
            if (type) {
              let newObj = this.dataService.Project.CreateChecklist(dev, type);
              this.createNodes();
              const newNode = NavTreeBase.FindNodeOfObject(newObj, this.nodes);
              this.selectedNode = newNode;
              newNode.isRenaming = true;
            }
          }
        },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(dev).subscribe(res => {
            if (res) {
              this.dataService.Project.DeleteContextElement(dev);
              if (this.selectedNode == node) this.selectedNode = null;
              let tab = this.tabs.find(x => x.nav.data?.ID == dev.ID);
              if (tab) this.RemoveTab(tab);
              this.createNodes();
            }
          });
        },
        canDuplicate: false,
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = this.dataService.Project.GetContextElements();
          let arrType = parentGroupNode.children.map(x => x.data);
          let idxType = arrType.findIndex(x => x.ID == dev.ID);
          if (idxType != 0) {
            let newIdx = arr.findIndex(x => x.ID == arrType[idxType-1].ID);
            this.dataService.Project.MoveItemInContextElements(arr.findIndex(x => x.ID == dev.ID), newIdx);
            parentGroupNode.children.splice(idxType, 0, parentGroupNode.children.splice(idxType-1, 1)[0]);
          } 
        },
        onMoveDown: () => {
          let arr = this.dataService.Project.GetContextElements();
          let arrType = parentGroupNode.children.map(x => x.data);
          let idxType = arrType.findIndex(x => x.ID == dev.ID);
          if (idxType != arrType.length-1) {
            let newIdx = arr.findIndex(x => x.ID == arrType[idxType+1].ID);
            this.dataService.Project.MoveItemInContextElements(arr.findIndex(x => x.ID == dev.ID), newIdx);
            parentGroupNode.children.splice(idxType, 0, parentGroupNode.children.splice(idxType+1, 1)[0]);
          } 
        },
        children: []
      };

      if (dev.AssetGroup) {
        let assets: INavigationNode = {
          name: () => 'Assets',
          icon: AssetGroup.Icon,
          iconAlignLeft: true,
          canSelect: true,
          data: dev.AssetGroup,
          dataType: NodeTypes.Assets,
          canDelete: true,
          onDelete: () => {
            let ag = dev.AssetGroup;
            this.dialog.OpenDeleteObjectDialog(ag).subscribe(res => {
              if (res) {
                let agn = NavTreeBase.FindNodeOfObject(ag, this.nodes);
                this.dataService.Project.DeleteAssetGroup(ag);
                if (this.selectedNode == agn) this.selectedNode = null;
                let tab = this.tabs.find(x => x.nav.data.ID == ag.ID);
                if (tab) this.RemoveTab(tab);
                this.createNodes();
              }
            });
          }
        };
        node.children.push(assets);
      }
      else {
        node.addOptions.push('Assets');
      }

      let hw: INavigationNode = {
        name: () => 'Hardware',
        icon: 'developer_board',
        iconAlignLeft: true,
        canSelect: true,
        data: dev.HardwareDiagram,
        dataType: NodeTypes.Hardware,
        canRename: false,
        canDelete: false,
        canDuplicate: false
      };
      node.children.push(hw);

      if (dev.SoftwareStack) {
        let sw: INavigationNode = {
          name: () => 'Software',
          icon: 'code',
          iconAlignLeft: true,
          canSelect: true,
          data: dev.SoftwareStack,
          dataType: NodeTypes.Software,
          canRename: false,
          canDelete: true,
          onDelete: () => {
            let stack = dev.SoftwareStack;
            this.dialog.OpenDeleteObjectDialog(stack).subscribe(res => {
              if (res) {
                let stackNode = NavTreeBase.FindNodeOfObject(stack, this.nodes);
                dev.DeleteSoftwareStack();
                if (this.selectedNode == stackNode) this.selectedNode = null;
                let tab = this.tabs.find(x => x.nav.data.ID == stack.ID);
                if (tab) this.RemoveTab(tab);
                this.createNodes();
              }
            });
          }
        };
        node.children.push(sw);
      }
      else {
        node.addOptions.push('Software');
      }

      if (dev.ProcessStack) {
        let p: INavigationNode = {
          name: () => 'Process',
          icon: 'policy',
          iconAlignLeft: true,
          canSelect: true,
          data: dev.ProcessStack,
          dataType: NodeTypes.Process,
          canRename: false,
          canDelete: true,
          onDelete: () => {
            let stack = dev.ProcessStack;
            this.dialog.OpenDeleteObjectDialog(stack).subscribe(res => {
              if (res) {
                let stackNode = NavTreeBase.FindNodeOfObject(stack, this.nodes);
                dev.DeleteProcessStack();
                if (this.selectedNode == stackNode) this.selectedNode = null;
                let tab = this.tabs.find(x => x.nav.data.ID == stack.ID);
                if (tab) this.RemoveTab(tab);
                this.createNodes();
              }
            });
          }
        };
        node.children.push(p);
      }
      else {
        node.addOptions.push('Process');
      }

      node.addOptions.push(...this.dataService.Config.GetChecklistTypes().map(x => this.translate.instant('general.Checklist') + ': ' + x.Name));

      dev.Checklists.forEach(x => node.children.push(createChecklist(x)));

      return node;
    };

    const createMobileApp = (app: MobileApp, parentGroupNode: INavigationNode): INavigationNode => {
      let node: INavigationNode = {
        name: () => { return app.Name },
        canSelect: false,
        data: app,
        canRename: true,
        onRename: (val: string) => { app.Name = val; },
        canAdd: true,
        addOptions: [],
        onAdd: (val: string) => {
          if (val == 'Assets') {
            let ag = pf.InitializeNewAssetGroup(pf.Config);
            app.Data['assetGroupID'] = ag.ID;
            this.createNodes();
            this.selectedNode = NavTreeBase.FindNodeOfObject(ag, this.nodes);
          }
          else if (val == 'Software') {
            let stack = app.CreateSoftwareStack();
            this.createNodes();
            this.selectedNode = NavTreeBase.FindNodeOfObject(stack, this.nodes);
          }
          else if (val == 'Process') {
            let stack = app.CreateProcessStack();
            this.createNodes();
            this.selectedNode = NavTreeBase.FindNodeOfObject(stack, this.nodes);
          }
          else {
            let type = this.dataService.Config.GetChecklistTypes().find(x => x.Name == val.replace('Checklist: ', ''));
            if (type) {
              let newObj = this.dataService.Project.CreateChecklist(app, type);
              this.createNodes();
              const newNode = NavTreeBase.FindNodeOfObject(newObj, this.nodes);
              this.selectedNode = newNode;
              newNode.isRenaming = true;
            }
          }
        },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(app).subscribe(res => {
            if (res) {
              this.dataService.Project.DeleteContextElement(app);
              if (this.selectedNode == node) this.selectedNode = null;
              let tab = this.tabs.find(x => x.nav.data?.ID == app.ID);
              if (tab) this.RemoveTab(tab);
              this.createNodes();
            }
          });
        },
        canDuplicate: false,
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = this.dataService.Project.GetContextElements();
          let arrType = parentGroupNode.children.map(x => x.data);
          let idxType = arrType.findIndex(x => x.ID == app.ID);
          if (idxType != 0) {
            let newIdx = arr.findIndex(x => x.ID == arrType[idxType-1].ID);
            this.dataService.Project.MoveItemInContextElements(arr.findIndex(x => x.ID == app.ID), newIdx);
            parentGroupNode.children.splice(idxType, 0, parentGroupNode.children.splice(idxType-1, 1)[0]);
          } 
        },
        onMoveDown: () => {
          let arr = this.dataService.Project.GetContextElements();
          let arrType = parentGroupNode.children.map(x => x.data);
          let idxType = arrType.findIndex(x => x.ID == app.ID);
          if (idxType != arrType.length-1) {
            let newIdx = arr.findIndex(x => x.ID == arrType[idxType+1].ID);
            this.dataService.Project.MoveItemInContextElements(arr.findIndex(x => x.ID == app.ID), newIdx);
            parentGroupNode.children.splice(idxType, 0, parentGroupNode.children.splice(idxType+1, 1)[0]);
          } 
        },
        children: []
      };

      if (app.AssetGroup) {
        let assets: INavigationNode = {
          name: () => 'Assets',
          icon: AssetGroup.Icon,
          iconAlignLeft: true,
          canSelect: true,
          data: app.AssetGroup,
          dataType: NodeTypes.Assets,
          canDelete: true,
          onDelete: () => {
            let ag = app.AssetGroup;
            this.dialog.OpenDeleteObjectDialog(ag).subscribe(res => {
              if (res) {
                let agn = NavTreeBase.FindNodeOfObject(ag, this.nodes);
                this.dataService.Project.DeleteAssetGroup(ag);
                if (this.selectedNode == agn) this.selectedNode = null;
                let tab = this.tabs.find(x => x.nav.data.ID == ag.ID);
                if (tab) this.RemoveTab(tab);
                this.createNodes();
              }
            });
          }
        };
        node.children.push(assets);
      }
      else {
        node.addOptions.push('Assets');
      }

      if (app.SoftwareStack) {
        let sw: INavigationNode = {
          name: () => 'Software',
          icon: 'code',
          iconAlignLeft: true,
          canSelect: true,
          data: app.SoftwareStack,
          dataType: NodeTypes.Software,
          canRename: false,
          canDelete: true,
          onDelete: () => {
            let stack = app.SoftwareStack;
            this.dialog.OpenDeleteObjectDialog(stack).subscribe(res => {
              if (res) {
                let stackNode = NavTreeBase.FindNodeOfObject(stack, this.nodes);
                app.DeleteSoftwareStack();
                if (this.selectedNode == stackNode) this.selectedNode = null;
                let tab = this.tabs.find(x => x.nav.data.ID == stack.ID);
                if (tab) this.RemoveTab(tab);
                this.createNodes();
              }
            });
          }
        };
        node.children.push(sw);
      }
      else {
        node.addOptions.push('Software');
      }

      if (app.ProcessStack) {
        let p: INavigationNode = {
          name: () => 'Process',
          icon: 'policy',
          iconAlignLeft: true,
          canSelect: true,
          data: app.ProcessStack,
          dataType: NodeTypes.Process,
          canRename: false,
          canDelete: true,
          onDelete: () => {
            let stack = app.ProcessStack;
            this.dialog.OpenDeleteObjectDialog(stack).subscribe(res => {
              if (res) {
                let stackNode = NavTreeBase.FindNodeOfObject(stack, this.nodes);
                app.DeleteProcessStack();
                if (this.selectedNode == stackNode) this.selectedNode = null;
                let tab = this.tabs.find(x => x.nav.data.ID == stack.ID);
                if (tab) this.RemoveTab(tab);
                this.createNodes();
              }
            });
          }
        };
        node.children.push(p);
      }
      else {
        node.addOptions.push('Process');
      }

      node.addOptions.push(...this.dataService.Config.GetChecklistTypes().map(x => 'Checklist: ' + x.Name));

      app.Checklists.forEach(x => node.children.push(createChecklist(x)));

      return node;
    };

    const createUseCase = (uc: Diagram, parentGroupNode: INavigationNode): INavigationNode => {
      let node: INavigationNode = {
        name: () => { return uc.Name },
        icon: 'account_tree',
        iconAlignLeft: true,
        canSelect: true,
        data: uc,
        dataType: NodeTypes.Dataflow,
        canRename: true,
        onRename: (val: string) => { uc.Name = val; },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(uc).subscribe(res => {
            if (res) {
              this.dataService.Project.DeleteDiagram(uc);
              if (this.selectedNode == node) this.selectedNode = null;
              let tab = this.tabs.find(x => x.nav.data.ID == uc.ID);
              if (tab) this.RemoveTab(tab);
              this.createNodes();
            }
          });
        },
        canDuplicate: false,
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = this.dataService.Project.GetDiagrams();
          let arrType = parentGroupNode.children.map(x => x.data);
          let idxType = arrType.findIndex(x => x.ID == uc.ID);
          if (idxType != 0) {
            let newIdx = arr.findIndex(x => x.ID == arrType[idxType-1].ID);
            arr.splice(newIdx, 0, arr.splice(arr.findIndex(x => x.ID == uc.ID), 1)[0]);
            parentGroupNode.children.splice(idxType, 0, parentGroupNode.children.splice(idxType-1, 1)[0]);
          } 
        },
        onMoveDown: () => {
          let arr = this.dataService.Project.GetDiagrams();
          let arrType = parentGroupNode.children.map(x => x.data);
          let idxType = arrType.findIndex(x => x.ID == uc.ID);
          if (idxType != arrType.length-1) {
            let newIdx = arr.findIndex(x => x.ID == arrType[idxType+1].ID);
            arr.splice(newIdx, 0, arr.splice(arr.findIndex(x => x.ID == uc.ID), 1)[0]);
            parentGroupNode.children.splice(idxType, 0, parentGroupNode.children.splice(idxType+1, 1)[0]);
          } 
        }
      };

      return node;
    };

    const modelInfo: INavigationNode = {
      name: () => { return this.translate.instant('dialog.modelinfo.title') },
      icon: 'source',
      iconAlignLeft: false,
      canSelect: true,
      data: this.dataService.Project,
    };

    const analysis: INavigationNode = {
      name: () => this.translate.instant('pages.modeling.analysis'),
      icon: 'create',
      iconAlignLeft: false,
      canSelect: false,
      children: [
        {
          name: () => 'Characterization & Scope',
          nameExtension: '(opt)',
          tooltipExtension: this.translate.instant('pages.modeling.optionalStep'),
          canSelect: true,
          iconAlignLeft: true,
          icon: 'edit_note', 
          data: pf.GetCharScope(),
          dataType: NodeTypes.CharScope
        },
        {
          name: () => 'Business Objectives & Impact',
          nameExtension: '(opt)',
          tooltipExtension: this.translate.instant('pages.modeling.optionalStep'),
          canSelect: true,
          iconAlignLeft: true,
          icon: 'outlined_flag',
          data: pf.GetObjImpact(),
          dataType: NodeTypes.ObjImpact
        },
        {
          name: () => 'System Interaction',
          nameExtension: '(opt)',
          tooltipExtension: this.translate.instant('pages.modeling.optionalStep'),
          canSelect: true,
          iconAlignLeft: true,
          icon: 'signpost',
          data: pf.GetSysContext()?.ContextDiagram,
          dataType: NodeTypes.Context
        }, 
        {
          name: () => 'Use Cases',
          nameExtension: '(opt)',
          tooltipExtension: this.translate.instant('pages.modeling.optionalStep'),
          canSelect: true,
          iconAlignLeft: true,
          icon: 'explore',
          data: pf.GetSysContext()?.UseCaseDiagram,
          dataType: NodeTypes.UseCase
        },  
        {
          name: () => 'Assets',
          nameExtension: '(opt*)',
          tooltipExtension: this.translate.instant('pages.modeling.optionalAsset'),
          canSelect: true,
          iconAlignLeft: true,
          icon: AssetGroup.Icon,
          data: pf.GetProjectAssetGroup(),
          dataType: NodeTypes.Assets,
          canDelete: true,
          onDelete: () => {
            let ag = pf.GetProjectAssetGroup();
            this.dialog.OpenDeleteObjectDialog(ag).subscribe(res => {
              if (res) {
                let agn = NavTreeBase.FindNodeOfObject(ag, this.nodes);
                this.dataService.Project.DeleteAssetGroup(ag);
                if (this.selectedNode == agn) this.selectedNode = null;
                let tab = this.tabs.find(x => x.nav.data.ID == ag.ID);
                if (tab) this.RemoveTab(tab);
                this.createNodes();
              }
            });
          }
        },       
        {
          name: () => 'Threat Sources',
          nameExtension: '(opt)',
          tooltipExtension: this.translate.instant('pages.modeling.optionalStep'),
          canSelect: true,
          iconAlignLeft: true,
          icon: 'portrait',
          data: pf.GetThreatSources(),
          dataType: NodeTypes.ThreatSources
        },
        {
          name: () => 'Threat Identification',
          canSelect: true,
          iconAlignLeft: true,
          icon: 'flash_on',
          dataType: NodeTypes.SystemThreats
        }
      ]
    };
    const assetIndex = analysis.children.findIndex(x => x.dataType == NodeTypes.Assets);
    if (analysis.children[assetIndex].data == null) {
      analysis.children.splice(assetIndex, 1);
      analysis.canAdd = true;
      analysis.addOptions = ['Assets'];
      analysis.onAdd = () => {
        let ag = pf.InitializeNewAssetGroup(pf.Config);
        pf.Data['projectAssetGroupId'] = ag.ID;
        this.createNodes();
        this.selectedNode = NavTreeBase.FindNodeOfObject(ag, this.nodes);
      }
    }

    const devices: INavigationNode = {
      name: () => this.translate.instant('pages.modeling.devices'),
      icon: Device.Icon,
      iconAlignLeft: false,
      canSelect: false,
      canAdd: true,
      onAdd: () => {
        this.dataService.Project.CreateDevice();
        this.createNodes();
      },
      children: []
    };

    const apps: INavigationNode = {
      name: () => this.translate.instant('pages.modeling.apps'),
      icon: MobileApp.Icon,
      iconAlignLeft: false,
      canSelect: false,
      isExpanded: false,
      canAdd: true,
      onAdd: () => {
        this.dataService.Project.CreateMobileApp();
        this.createNodes();
      },
      children: []
    };

    const useCases: INavigationNode = {
      name: () => this.translate.instant('pages.modeling.useCaseDFDs'),
      icon: 'account_tree',
      iconAlignLeft: false,
      canSelect: false,
      canAdd: true,
      onAdd: () => {
        let newObj = this.dataService.Project.CreateDiagram(DiagramTypes.DataFlow);
        this.createNodes();
        const newNode = NavTreeBase.FindNodeOfObject(newObj, this.nodes);
        this.selectedNode = newNode;
        newNode.isRenaming = true;
      },
      children: [],
    };

    const testCases: INavigationNode = {
      name: () => { return this.translate.instant('general.TestCases') },
      icon: 'checklist',
      iconAlignLeft: false,
      canSelect: true,
      data: this.dataService.Project.GetTesting(),
    };

    pf.GetDevices().forEach(x => devices.children.push(createDevice(x, devices)));
    pf.GetMobileApps().forEach(x => apps.children.push(createMobileApp(x, apps)));
    pf.GetDFDiagrams().forEach(x => useCases.children.push(createUseCase(x, useCases)));

    this.nodes.push(modelInfo);
    this.nodes.push(analysis);
    this.nodes.push(devices);
    this.nodes.push(apps);
    this.nodes.push(useCases);
    if (testCases.data) this.nodes.push(testCases);
    NavTreeBase.TransferExpandedState(prevNodes, this.nodes);
    if (this.navTree) { this.navTree.SetNavTreeData(this.nodes, selectedObject); }
  }
}