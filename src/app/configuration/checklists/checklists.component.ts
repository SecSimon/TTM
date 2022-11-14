import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ChecklistType, IChecklistLevel, ReqFulfillRuleTypes, ReqFulfillRuleTypesUtil, RequirementType } from '../../model/checklist';
import { DatabaseBase, IProperty, PropertyEditTypes } from '../../model/database';
import { IPropertyRestriction, PropertyComparisonTypes } from '../../model/threat-model';
import { NavTreeBase } from '../../shared/components/nav-tree/nav-tree-base';
import { INavigationNode, NavTreeComponent } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { LocalStorageService, LocStorageKeys } from '../../util/local-storage.service';
import { StringExtension } from '../../util/string-extension';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-checklists',
  templateUrl: './checklists.component.html',
  styleUrls: ['./checklists.component.scss']
})
export class ChecklistsComponent extends NavTreeBase implements OnInit {
  private _selectedRequirementNode: INavigationNode;

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  @Input()
  public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
    this.selectedLevel = null;
    this.selectedRequirementNode = null;
    setTimeout(() => {
      this.createRequirementNodes();
    }, 100);
  }

  public get selectedChecklistType(): ChecklistType { return this.selectedNode?.data; }
  public selectedLevel: IChecklistLevel;

  @ViewChild('reqNavTree') reqNavTree: NavTreeComponent;

  public get selectedRequirementNode(): INavigationNode { return this._selectedRequirementNode; }
  @Input()
  public set selectedRequirementNode(val: INavigationNode) {
    this._selectedRequirementNode = val;
    this.selectedRequirementType = val?.data;
  }
  public selectedRequirementType: RequirementType;

  constructor(public theme: ThemeService, public dataService: DataService, private dialog: DialogService, 
    private translate: TranslateService, private locStorage: LocalStorageService) { 
    super();
    dataService.ConfigChanged.subscribe(x => this.createNodes());
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.createNodes();
    }, 100);
  }

  public AddLevel() {
    this.selectedChecklistType.Levels.push({ Name: StringExtension.FindUniqueName('Level', this.selectedChecklistType.Levels.map(x => x.Name)), Abbr: '', Description: '' });
  }

  public DeleteLevel(level: IChecklistLevel) {
    const index = this.selectedChecklistType.Levels.findIndex(x => x.Name == level.Name && x.Abbr == level.Abbr);
    if (index >= 0) {
      this.selectedChecklistType.Levels.splice(index, 1);
    }
  }

  public OnRequiredChanged(event, index) {
    if (event.checked) {
      for (let i = index+1; i < this.selectedChecklistType.Levels.length; i++) {
        this.selectedRequirementType.RequiredPerLevel[i] = true;
      }
    }
  }

  public OnReqRuleTypeChanged(event) {
    if (event.value == ReqFulfillRuleTypes.SWComponent) {
      this.selectedRequirementType.ReqFulfillRule.SWRule = {ComponentTypeID: '', PropertyRest: { ID: '', ComparisonType: PropertyComparisonTypes.Equals, Value: true }};
    }
  }

  public componentProperties = {};
  public GetAvailableProperties(): IProperty[] {
    let typeID = this.selectedRequirementType.ReqFulfillRule.SWRule.ComponentTypeID;

    if (this.componentProperties[typeID] == null) {
      let type = this.dataService.Config.GetMyComponentType(typeID);
      let res: IProperty[] = [];
      res.push({ DisplayName: 'properties.IsActive', ID: 'IsActive', Tooltip: '', HasGetter: true, Type: PropertyEditTypes.CheckBox, Editable: true });
      res.push({ DisplayName: 'properties.IsThirdParty', ID: 'IsThirdParty', Tooltip: '', HasGetter: true, Type: PropertyEditTypes.CheckBox, Editable: true });
      res.push(...type.Properties);
      this.componentProperties[typeID] = res;
    }
    return this.componentProperties[typeID];
  }

  public OnNextComparisonType(propRest: IPropertyRestriction) {
    let vals = Object.values(PropertyComparisonTypes);
    let max = vals.length;
    //if (this.GetPropertyEditType(rest) == PropertyEditTypes.CheckBox) max = 2;
    max = 2;
    propRest.ComparisonType = vals[(vals.indexOf(propRest.ComparisonType)+1) % max] as PropertyComparisonTypes;
  }  
  
  public drop(event: CdkDragDrop<string[]>, selectedArray) {
    moveItemInArray(selectedArray, event.previousIndex, event.currentIndex);
  }

  public GetMyComponentSWTypes() {
    return this.dataService.Config.GetMyComponentSWTypes();
  }

  public GetReqFulfillRuleTypes() {
    return ReqFulfillRuleTypesUtil.GetTypes();
  }

  public GetReqFulfillRuleTypeName(type: ReqFulfillRuleTypes) {
    return ReqFulfillRuleTypesUtil.ToString(type);
  }

  public GetSelectedTabIndex() {
    let index = this.locStorage.Get(LocStorageKeys.PAGE_CONFIG_CHECKLISTS_TAB_INDEX);
    if (index != null) return index;
    else return 0;
  }

  public SetSelectedTabIndex(event) {
    this.locStorage.Set(LocStorageKeys.PAGE_CONFIG_CHECKLISTS_TAB_INDEX, event);
  }

  public GetSplitSize(splitter: number, gutter: number, defaultSize: number) {
    let size = this.locStorage.Get(LocStorageKeys.PAGE_CONFIG_CHECKLISTS_SPLIT_SIZE_X + splitter.toString());
    if (size != null) return Number(JSON.parse(size)[gutter]);
    return defaultSize;
  }

  public OnSplitSizeChange(event, splitter: number) {
    this.locStorage.Set(LocStorageKeys.PAGE_CONFIG_CHECKLISTS_SPLIT_SIZE_X + splitter.toString(), JSON.stringify(event['sizes']));
  }

  private createNodes() {
    const prevNodes = this.Nodes;
    this.Nodes = [];

    let createGroup = (group: ChecklistType, root: INavigationNode): INavigationNode => {
      let node: INavigationNode = {
        name: () => group.Name,
        canSelect: true,
        data: group,
        canAdd: false,
        canRename: true,
        onRename: (val: string) => { group.Name = val; },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(group).subscribe(res => {
            if (res) {
              this.dataService.Config.DeleteChecklistType(group);
              if (this.selectedNode == node) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        children: [],
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = this.dataService.Config.GetChecklistTypes();
          if (arr.findIndex(x => x.ID == group.ID) != 0) {
            let idx = arr.findIndex(x => x.ID == group.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            root.children.splice(idx, 0, root.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = this.dataService.Config.GetChecklistTypes();
          if (arr.findIndex(x => x.ID == group.ID) != arr.length-1) {
            let idx = arr.findIndex(x => x.ID == group.ID);
            arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
            root.children.splice(idx, 0, root.children.splice(idx+1, 1)[0]);
          }
        }
      };

      return node;
    };
    
    let root: INavigationNode = {
      name: () => this.translate.instant('general.Checklists'),
      canSelect: false,
      icon: 'fact_check',
      canAdd: true,
      hasMenu: true,
      onAdd: () => {
        let newObj = this.dataService.Config.CreateChecklistType();
        this.createNodes();
        this.selectedNode = this.FindNodeOfObject(newObj);
        this.selectedNode.isRenaming = true;
      },
      children: [],
    };

    this.dataService.Config.GetChecklistTypes().forEach(x => {
      let g = createGroup(x, root);
      root.children.push(g);
    });

    this.Nodes.push(root);
    NavTreeBase.TransferExpandedState(prevNodes, this.Nodes);
    this.nodeTreeChanged.emit(this.Nodes);
  }

  private reqNodes: INavigationNode[];
  private createRequirementNodes() {
    const prevNodes = this.reqNodes;
    this.reqNodes = [];

    let createType = (type: RequirementType, groupNode: INavigationNode): INavigationNode => {
      let node: INavigationNode = {
        name: () => type.Name,
        canSelect: true,
        data: type,
        canAdd: true,
        onAdd: () => {
          let newObj = this.dataService.Config.CreateRequirementType();
          type.AddSubRequirementType(newObj);
          this.createRequirementNodes();
          this.selectedRequirementNode = this.ReqFindNodeOfObject(newObj);
          this.selectedRequirementNode.isRenaming = true;
        },
        canRename: true,
        onRename: (val: string) => { type.Name = val; },
        canDuplicate: true,
        onDuplicate: () => {
          let cp = this.dataService.Config.CreateRequirementType();
          cp.CopyFrom(type.Data);
          cp.Name = cp.Name + '-Copy';
          if (groupNode.data instanceof ChecklistType) {
            groupNode.data.AddRequirementType(cp);
          }
          else if (groupNode.data instanceof RequirementType) {
            groupNode.data.AddSubRequirementType(cp);
          }
          
          this.createRequirementNodes();
          this.selectedRequirementNode = this.ReqFindNodeOfObject(cp);
          this.selectedRequirementNode.isRenaming = true;
        },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(type).subscribe(res => {
            if (res) {
              this.dataService.Config.DeleteRequirementType(type);
              if (this.selectedNode == node) this.selectedNode = null;
              this.createRequirementNodes();
            }
          });
        },
        children: [],
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = [];
          if (groupNode.data instanceof ChecklistType) {
            arr = groupNode.data.Data['requirementTypeIDs'];
          }
          else if (groupNode.data instanceof RequirementType) {
            arr = groupNode.data.Data['subReqTypeIDs'];
          }

          if (arr.findIndex(x => x == type.ID) != 0) {
            let idx = arr.findIndex(x => x == type.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = [];
          if (groupNode.data instanceof ChecklistType) {
            arr = groupNode.data.Data['requirementTypeIDs'];
          }
          else if (groupNode.data instanceof RequirementType) {
            arr = groupNode.data.Data['subReqTypeIDs'];
          }

          if (arr.findIndex(x => x == type.ID) != arr.length-1) {
            let idx = arr.findIndex(x => x == type.ID);
            arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
            root.children.splice(idx, 0, root.children.splice(idx+1, 1)[0]);
          }
        }
      };

      type.SubReqTypes.forEach(x => node.children.push(createType(x, node)));

      return node;
    };
    
    let root: INavigationNode = {
      name: () => this.translate.instant('general.Requirements'),
      canSelect: false,
      icon: 'check_circle_outline',
      data: this.selectedChecklistType,
      canAdd: true,
      hasMenu: true,
      onAdd: () => {
        let newObj = this.dataService.Config.CreateRequirementType();
        this.selectedChecklistType.AddRequirementType(newObj);
        this.createRequirementNodes();
        this.selectedRequirementNode = this.ReqFindNodeOfObject(newObj);
        this.selectedRequirementNode.isRenaming = true;
      },
      children: [],
    };

    if (this.selectedChecklistType) {
      this.selectedChecklistType.RequirementTypes.forEach(x => {
        let g = createType(x, root);
        root.children.push(g);
      });
  
      this.reqNodes.push(root);
      NavTreeBase.TransferExpandedState(prevNodes, this.reqNodes);
      this.reqNavTree?.SetNavTreeData(this.reqNodes);
    }
  }

  public ReqFindNodeOfObject(obj: DatabaseBase): INavigationNode {
    return this.reqFindNodeOfObjectRec(obj, this.reqNodes);
  }

  private reqFindNodeOfObjectRec(obj: DatabaseBase, nodes: INavigationNode[]): INavigationNode {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].data == obj) return nodes[i];
      else if (nodes[i].children) {
        let res = this.reqFindNodeOfObjectRec(obj, nodes[i].children);
        if (res) return res;
      }
    }
  }
}
