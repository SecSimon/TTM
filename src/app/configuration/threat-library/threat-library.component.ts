import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThreatOriginGroup, ThreatOrigin } from '../../model/threat-model';
import { NavTreeBase } from '../../shared/components/nav-tree/nav-tree-base';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-threat-library',
  templateUrl: './threat-library.component.html',
  styleUrls: ['./threat-library.component.scss']
})
export class ThreatLibraryComponent extends NavTreeBase implements OnInit {

  public get selectedThreatOriginGroup(): ThreatOriginGroup { return (this.selectedNode?.data instanceof ThreatOriginGroup ? this.selectedNode.data : null); }
  public get selectedThreatOrigin(): ThreatOrigin { return (this.selectedNode?.data instanceof ThreatOrigin ? this.selectedNode.data : null); }

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

    let createOrigin = (origin: ThreatOrigin, group: ThreatOriginGroup, groupNode: INavigationNode, groupNodes: INavigationNode[]): INavigationNode => {
      let node: INavigationNode = {
        name: () => origin.Name,
        canSelect: true,
        data: origin,
        canRename: true,
        onRename: (val: string) => { origin.Name = val; },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(origin).subscribe(res => {
            if (res) {
              this.dataService.Config.DeleteThreatOrigin(origin);
              if (this.selectedNode == node) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        canDuplicate: true,
        onDuplicate: () => {
          let cp = this.dataService.Config.CreateThreatOrigin(group);
          cp.CopyFrom(origin.Data);
          cp.Name = cp.Name + '-Copy';
          this.createNodes();
          this.selectedNode = this.FindNodeOfObject(cp);
          this.selectedNode.isRenaming = true;
        },
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = group.Data['threatOriginIDs'];
          if (arr.findIndex(x => x == origin.ID) != 0) {
            let idx = arr.findIndex(x => x == origin.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = group.Data['threatOriginIDs'];
          if (arr.findIndex(x => x == origin.ID) != arr.length-1) {
            let idx = arr.findIndex(x => x == origin.ID);
            arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx+1, 1)[0]);
          }
        },
        canMoveToGroup: true,
        onMoveToGroups: () => {
          return groupNodes.filter(x => x != groupNode);
        },
        onMoveToGroup: (newGroup: INavigationNode) => {
          let arrName = 'threatOriginIDs';
          group.Data[arrName].splice(group.Data[arrName].indexOf(origin.ID), 1);
          newGroup.data.Data[arrName].push(origin.ID);
          this.createNodes();
        }
      };
      return node;
    };

    let createGroup = (group: ThreatOriginGroup, parentGroup: ThreatOriginGroup, parentGroupNode: INavigationNode, groupNodes: INavigationNode[]): INavigationNode => {
      let g: INavigationNode = {
        name: () => group.Name,
        canSelect: true,
        data: group,
        canAdd: true,
        addOptions: [this.translate.instant('general.Group'), this.translate.instant('general.ThreatOrigin')],
        onAdd: (val: string) => {
          let newObj = null;
          if (val == this.translate.instant('general.Group')) { newObj = this.dataService.Config.CreateThreatOriginGroup(group); }
          else { newObj = this.dataService.Config.CreateThreatOrigin(group); }

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
              this.dataService.Config.DeleteThreatOriginGroup(group); 
              if (this.selectedNode == g) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        children: [],
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = parentGroup.Data['threatOriginGroupIDs'];
          if (arr.findIndex(x => x == group.ID) != 0) {
            let idx = arr.findIndex(x => x == group.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            parentGroupNode.children.splice(idx, 0, parentGroupNode.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = parentGroup.Data['threatOriginGroupIDs'];
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
          let arrName = 'threatOriginGroupIDs';
          parentGroup.Data[arrName].splice(parentGroup.Data[arrName].indexOf(group.ID), 1);
          newGroup.data.Data[arrName].push(group.ID);
          this.createNodes();
        }
      };

      group.SubGroups.forEach(x => {
        let subGroup = createGroup(x, group, g, groupNodes);
        g.children.push(subGroup);
      });

      group.ThreatOrigins.forEach(x => g.children.push(createOrigin(x, group, g, groupNodes)));

      groupNodes.push(g);
      return g;
    };

    let groupNodes = [];
    let root = createGroup(this.dataService.Config.ThreatLibrary, null, null, groupNodes);
    root.icon = 'library_books'; 
    root.canSelect = false;
    root.canDelete = false;
    root.addOptions = null;
    root.canRename = false;
    root.hasMenu = true;

    this.Nodes.push(root);
    NavTreeBase.TransferExpandedState(prevNodes, this.Nodes);
    this.nodeTreeChanged.emit(this.Nodes);
  }
}
