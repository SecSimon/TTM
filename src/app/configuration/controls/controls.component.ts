import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Control, ControlGroup } from '../../model/mitigations';
import { NavTreeBase } from '../../shared/components/nav-tree/nav-tree-base';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss']
})
export class ControlsComponent extends NavTreeBase implements OnInit {

  public get selectedControlGroup(): ControlGroup { return (this.selectedNode?.data instanceof ControlGroup ? this.selectedNode.data : null); }
  public get selectedControl(): Control { return (this.selectedNode?.data instanceof Control ? this.selectedNode.data : null); }

  constructor(public theme: ThemeService, public dataService: DataService, private dialog: DialogService, private translate: TranslateService) { 
    super();
    dataService.ConfigChanged.subscribe(x => this.createNodes());
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.createNodes();
    }, 100);
  }

  private createNodes() {
    const prevNodes = this.Nodes;
    this.Nodes = [];

    let createRule = (mit: Control, group: ControlGroup, groupNode: INavigationNode, groupNodes: INavigationNode[]): INavigationNode => {
      let node: INavigationNode = {
        name: () => mit.Name,
        canSelect: true,
        data: mit,
        canRename: true,
        onRename: (val: string) => { mit.Name = val; },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(mit).subscribe(res => {
            if (res) {
              this.dataService.Config.DeleteControl(mit);
              if (this.selectedNode == node) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        canDuplicate: true,
        onDuplicate: () => {
          let cp = this.dataService.Config.CreateControl(group);
          cp.CopyFrom(mit.Data);
          cp.Name = cp.Name + '-Copy';
          this.dataService.Config.GetControlGroups().find(x => x.Controls.includes(mit)).AddControl(cp);
          this.createNodes();
          this.selectedNode = this.FindNodeOfObject(cp);
          this.selectedNode.isRenaming = true;
        },
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = group.Data['controlIDs'];
          if (arr.findIndex(x => x == mit.ID) != 0) {
            let idx = arr.findIndex(x => x == mit.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = group.Data['controlIDs'];
          if (arr.findIndex(x => x == mit.ID) != arr.length-1) {
            let idx = arr.findIndex(x => x == mit.ID);
            arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx+1, 1)[0]);
          }
        },
        canMoveToGroup: true,
        onMoveToGroups: () => {
          return groupNodes.filter(x => x != groupNode);
        },
        onMoveToGroup: (newGroup: INavigationNode) => {
          let arrName = 'controlIDs';
          group.Data[arrName].splice(group.Data[arrName].indexOf(mit.ID), 1);
          newGroup.data.Data[arrName].push(mit.ID);
          this.createNodes();
        }
      };
      return node;
    };

    let createGroup = (group: ControlGroup, parentGroup: ControlGroup, parentGroupNode: INavigationNode, groupNodes: INavigationNode[]): INavigationNode => {
      let g: INavigationNode = {
        name: () => group.Name,
        canSelect: true,
        data: group,
        canAdd: true,
        addOptions: [this.translate.instant('general.Group'), this.translate.instant('general.Control')],
        onAdd: (val: string) => {
          let newObj = null;
          if (val == this.translate.instant('general.Group')) { newObj = this.dataService.Config.CreateControlGroup(group); }
          else { newObj = this.dataService.Config.CreateControl(group); }

          this.createNodes();
          setTimeout(() => {
            this.selectedNode = this.FindNodeOfObject(newObj);
            this.selectedNode.isRenaming = true;
          }, 100);
        },
        canRename: true,
        onRename: (val: string) => { group.Name = val; },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(group).subscribe(res => {
            if (res) {
              this.dataService.Config.DeleteControlGroup(group); 
              if (this.selectedNode == g) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        children: [],
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = parentGroup.Data['controlGroupIDs'];
          if (arr.findIndex(x => x == group.ID) != 0) {
            let idx = arr.findIndex(x => x == group.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            parentGroupNode.children.splice(idx, 0, root.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = parentGroup.Data['controlGroupIDs'];
          if (arr.findIndex(x => x == group.ID) != arr.length-1) {
            let idx = arr.findIndex(x => x == group.ID);
            arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
            parentGroupNode.children.splice(idx, 0, root.children.splice(idx+1, 1)[0]);
          }
        },
        canMoveToGroup: true,
        onMoveToGroups: () => {
          return groupNodes.filter(x => x != g && x != parentGroupNode);
        },
        onMoveToGroup: (newGroup: INavigationNode) => {
          let arrName = 'controlGroupIDs';
          parentGroup.Data[arrName].splice(parentGroup.Data[arrName].indexOf(group.ID), 1);
          newGroup.data.Data[arrName].push(group.ID);
          this.createNodes();
        }
      };

      group.SubGroups.forEach(x => {
        let subGroup = createGroup(x, group, g, groupNodes);
        g.children.push(subGroup);
      });

      group.Controls.forEach(x => g.children.push(createRule(x, group, g, groupNodes)));
      
      groupNodes.push(g);
      return g;
    };

    let groupNodes = [];
    let root = createGroup(this.dataService.Config.ControlLibrary, null, null, groupNodes);
    root.icon = 'security'; 
    root.canSelect = false;
    root.canDelete = false;
    root.hasMenu = true;

    this.Nodes.push(root);
    NavTreeBase.TransferExpandedState(prevNodes, this.Nodes);
    this.nodeTreeChanged.emit(this.Nodes);
  }
}
