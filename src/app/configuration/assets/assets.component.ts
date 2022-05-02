import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { AssetGroup, LowMediumHighNumber, LowMediumHighNumberUtil, MyData } from '../../model/assets';
import { NavTreeBase } from '../../shared/components/nav-tree/nav-tree-base';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.component.html',
  styleUrls: ['./assets.component.scss']
})
export class AssetsComponent extends NavTreeBase implements OnInit {

  @Input()
  public assetGroup: AssetGroup;

  @Input()
  public isProject: boolean;

  public get selectedAssetGroup(): AssetGroup { return (this.selectedNode?.data instanceof AssetGroup ? this.selectedNode.data : null); }
  public selectedMyData: MyData = null;

  constructor(public theme: ThemeService, private dataService: DataService, private dialog: DialogService) {
    super();
    dataService.ConfigChanged.subscribe(x => this.createNodes());
  }

  ngOnInit(): void {
    if (this.isProject == null) console.error('isProject is unset');
    setTimeout(() => {
      this.createNodes();
    }, 100);
  }

  public AddMyData() {
    let data;
    if (this.isProject) data = this.dataService.Project.CreateMyData(this.selectedAssetGroup);
    else data = this.dataService.Config.CreateMyData(this.selectedAssetGroup);
    this.selectedMyData = data;
  }

  public DeleteMyData(data: MyData) {
    if (this.isProject) this.dataService.Project.DeleteMyData(data);
    else this.dataService.Config.DeleteMyData(data);
    if (this.selectedMyData == data) this.selectedMyData = null;
  }

  public GetMoveToGroups(data: MyData) {
    return this.assetGroup.GetGroupsFlat().filter(x => !x.AssociatedData.includes(data));
  }

  public OnMoveToGroup(data: MyData, group: AssetGroup) {
    let priv = this.assetGroup.GetGroupsFlat().find(x => x.AssociatedData.includes(data));
    priv.RemoveMyData(data);
    group.AddMyData(data);
  }

  public dropWrapper(event: CdkDragDrop<string[]>, selectedArray: MyData[]) {
    let IDs = selectedArray.map(x => x.ID);
    moveItemInArray(IDs, event.previousIndex, event.currentIndex);
    let res: MyData[] = [];
    IDs.forEach(x => res.push(selectedArray.find(y => y.ID == x)));
    this.selectedAssetGroup.AssociatedData = res;
  }

  public GetSensitivity(val: LowMediumHighNumber): string {
    return LowMediumHighNumberUtil.ToString(val);
  }

  private createNodes() {
    const prevNodes = this.Nodes;
    this.Nodes = [];

    let file = null;
    if (this.isProject) file = this.dataService.Project;
    else file = this.dataService.Config;

    let createGroup = (group: AssetGroup, parentGroup: AssetGroup, parentGroupNode: INavigationNode, groupNodes: INavigationNode[]): INavigationNode => {
      let g: INavigationNode = {
        name: () => group.Name,
        canSelect: true,
        canAdd: true,
        isInactive: () => { return !group.IsActive; },
        data: group,
        onAdd: () => {
          let newObj = file.CreateAssetGroup(group);
          this.createNodes();
          this.selectedNode = this.FindNodeOfObject(newObj);
          this.selectedNode.isRenaming = true;
        },
        canRename: true,
        onRename: (val: string) => { group.Name = val; },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(group).subscribe(res => {
            if (res) {
              file.DeleteAssetGroup(group); 
              if (this.selectedNode == g) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        children: [],
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = parentGroup.Data['assetGroupIDs'];
          if (arr.findIndex(x => x == group.ID) != 0) {
            let idx = arr.findIndex(x => x == group.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            parentGroupNode.children.splice(idx, 0, parentGroupNode.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = parentGroup.Data['assetGroupIDs'];
          if (arr.findIndex(x => x == group.ID) != arr.length-1) {
            let idx = arr.findIndex(x => x == group.ID);
            arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
            parentGroupNode.children.splice(idx, 0, parentGroupNode.children.splice(idx+1, 1)[0]);
          }
        },
        canMoveToGroup: true,
        onMoveToGroups: () => {
          return groupNodes.filter(x => x != g && x != parentGroupNode);
        },
        onMoveToGroup: (newGroup: INavigationNode) => {
          let arrName = 'assetGroupIDs';
          parentGroup.Data[arrName].splice(parentGroup.Data[arrName].indexOf(group.ID), 1);
          newGroup.data.Data[arrName].push(group.ID);
          this.createNodes();
        }
      };

      if (this.isProject) {
        const configMath = this.dataService.Config.AssetGroups.GetGroupsFlat().find(x => x.Name == group.Name && x.Parent != null && x.Parent?.Name == group.Parent?.Name);
        if (!configMath) {
          g.icon = 'add_circle_outline';
          g.iconAlignLeft = true;
        }
      }

      if (g.isExpanded == null && !group.IsActive) g.isExpanded = false;

      group.SubGroups.forEach(x => {
        let subGroup = createGroup(x, group, g, groupNodes);
        g.children.push(subGroup);
      });

      groupNodes.push(g);
      return g;
    };

    if (this.assetGroup) {
      let groupNodes = [];
      let root = createGroup(this.assetGroup, null, null, groupNodes);
      root.icon = 'account_balance'; 
      root.iconAlignLeft = false;
      root.canDelete = false;
  
      this.Nodes.push(root);
      NavTreeBase.TransferExpandedState(prevNodes, this.Nodes);
      this.nodeTreeChanged.emit(this.Nodes);
    }
  }
}
