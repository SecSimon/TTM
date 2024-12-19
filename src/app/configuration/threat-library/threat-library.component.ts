import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AttackVectorGroup, AttackVector } from '../../model/threat-model';
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

  public get selectedAttackVectorGroup(): AttackVectorGroup { return (this.selectedNode?.data instanceof AttackVectorGroup ? this.selectedNode.data : null); }
  public get selectedAttackVector(): AttackVector { return (this.selectedNode?.data instanceof AttackVector ? this.selectedNode.data : null); }

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

    let createVector = (vector: AttackVector, group: AttackVectorGroup, groupNode: INavigationNode, groupNodes: INavigationNode[]): INavigationNode => {
      let node: INavigationNode = {
        name: () => vector.Name,
        canSelect: true,
        data: vector,
        canRename: true,
        onRename: (val: string) => { vector.Name = val; },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(vector).subscribe(res => {
            if (res) {
              this.dataService.Config.DeleteAttackVector(vector);
              if (this.selectedNode == node) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        canDuplicate: true,
        onDuplicate: () => {
          let cp = this.dataService.Config.CreateAttackVector(group);
          cp.CopyFrom(vector);
          cp.Name = cp.Name + '-Copy';
          this.createNodes();
          this.selectedNode = this.FindNodeOfObject(cp);
          this.selectedNode.isRenaming = true;
        },
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = group.Data['attackVectorIDs'];
          if (arr.findIndex(x => x == vector.ID) != 0) {
            let idx = arr.findIndex(x => x == vector.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = group.Data['attackVectorIDs'];
          if (arr.findIndex(x => x == vector.ID) != arr.length-1) {
            let idx = arr.findIndex(x => x == vector.ID);
            arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx+1, 1)[0]);
          }
        },
        canMoveToGroup: true,
        onMoveToGroups: () => {
          return groupNodes.filter(x => x != groupNode);
        },
        onMoveToGroup: (newGroup: INavigationNode) => {
          let arrName = 'attackVectorIDs';
          group.Data[arrName].splice(group.Data[arrName].indexOf(vector.ID), 1);
          newGroup.data.Data[arrName].push(vector.ID);
          this.createNodes();
        }
      };
      return node;
    };

    let createGroup = (group: AttackVectorGroup, parentGroup: AttackVectorGroup, parentGroupNode: INavigationNode, groupNodes: INavigationNode[]): INavigationNode => {
      let g: INavigationNode = {
        name: () => group.Name,
        canSelect: true,
        data: group,
        canAdd: true,
        addOptions: [this.translate.instant('general.Group'), this.translate.instant('general.AttackVector')],
        onAdd: (val: string) => {
          let newObj = null;
          if (val == this.translate.instant('general.Group')) { newObj = this.dataService.Config.CreateAttackVectorGroup(group); }
          else { newObj = this.dataService.Config.CreateAttackVector(group); }

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
              this.dataService.Config.DeleteAttackVectorGroup(group); 
              if (this.selectedNode == g) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        children: [],
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = parentGroup.Data['attackVectorGroupIDs'];
          if (arr.findIndex(x => x == group.ID) != 0) {
            let idx = arr.findIndex(x => x == group.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            parentGroupNode.children.splice(idx, 0, parentGroupNode.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = parentGroup.Data['attackVectorGroupIDs'];
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
          let arrName = 'attackVectorGroupIDs';
          parentGroup.Data[arrName].splice(parentGroup.Data[arrName].indexOf(group.ID), 1);
          newGroup.data.Data[arrName].push(group.ID);
          this.createNodes();
        }
      };

      group.SubGroups.forEach(x => {
        let subGroup = createGroup(x, group, g, groupNodes);
        g.children.push(subGroup);
      });

      group.AttackVectors.forEach(x => g.children.push(createVector(x, group, g, groupNodes)));

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
