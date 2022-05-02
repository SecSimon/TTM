import { Component, OnInit } from '@angular/core';
import { ImpactCategories, ImpactCategoryUtil, ThreatCategory, ThreatCategoryGroup } from '../../model/threat-model';
import { DataService } from '../../util/data.service';
import { ThemeService } from '../../util/theme.service';

import { DialogService } from '../../util/dialog.service';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { NavTreeBase } from '../../shared/components/nav-tree/nav-tree-base';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-threat-categories',
  templateUrl: './threat-categories.component.html',
  styleUrls: ['./threat-categories.component.scss']
})
export class ThreatCategoriesComponent extends NavTreeBase implements OnInit {

  public get selectedThreatCatGroup(): ThreatCategoryGroup { return (this.selectedNode?.data instanceof ThreatCategoryGroup ? this.selectedNode.data : null); }
  public get selectedThreatCat(): ThreatCategory { return (this.selectedNode?.data instanceof ThreatCategory ? this.selectedNode.data : null); }

  constructor(public theme: ThemeService, private dataService: DataService, private dialog: DialogService, private translate: TranslateService) { 
    super();
    dataService.ConfigChanged.subscribe(x => this.createNodes());
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.createNodes();
    }, 100);
  }

  public ImpactCatChanged(cat: ThreatCategory, impact: ImpactCategories) {
    const index = cat.ImpactCats.indexOf(impact);
    if (index >= 0) cat.ImpactCats.splice(index, 1);
    else cat.ImpactCats.push(impact);
  }

  public GetImpactCategories() {
    return ImpactCategoryUtil.GetKeys();
  }

  public GetImpactCategoryName(cat: ImpactCategories) {
    return ImpactCategoryUtil.ToString(cat);
  }

  private createNodes() {
    const prevNodes = this.Nodes;
    this.Nodes = [];

    let createCategory = (cat: ThreatCategory, group: ThreatCategoryGroup, groupNode: INavigationNode, root: INavigationNode): INavigationNode => {
      let node: INavigationNode = {
        name: () => cat.Name,
        canSelect: true,
        data: cat,
        canRename: true,
        onRename: (val: string) => { cat.Name = val; },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(cat).subscribe(res => {
            if (res) {
              this.dataService.Config.DeleteThreatCategory(cat);
              if (this.selectedNode == node) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        canDuplicate: true,
        onDuplicate: () => {
          let cp = this.dataService.Config.CreateThreatCategory();
          cp.CopyFrom(cat.Data);
          cp.Name = cp.Name + '-Copy';
          this.dataService.Config.GetThreatCategoryGroups().find(x => x.ThreatCategories.includes(cat)).AddThreatCategory(cp);
          this.createNodes();
          this.selectedNode = this.FindNodeOfObject(cp);
          this.selectedNode.isRenaming = true;
        },
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = group.Data['threatCategorieIDs'];
          if (arr.findIndex(x => x == cat.ID) != 0) {
            let idx = arr.findIndex(x => x == cat.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = group.Data['threatCategorieIDs'];
          if (arr.findIndex(x => x == cat.ID) != arr.length-1) {
            let idx = arr.findIndex(x => x == cat.ID);
            arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx+1, 1)[0]);
          }
        },
        canMoveToGroup: true,
        onMoveToGroups: () => {
          return root.children.filter(x => x != groupNode);
        },
        onMoveToGroup: (newGroup: INavigationNode) => {
          let arrName = 'threatCategorieIDs';
          group.Data[arrName].splice(group.Data[arrName].indexOf(cat.ID), 1);
          newGroup.data.Data[arrName].push(cat.ID);
          this.createNodes();
        }
      };
      return node;
    };

    let createGroup = (group: ThreatCategoryGroup): INavigationNode => {
      let node: INavigationNode = {
        name: () => group.Name,
        canSelect: true,
        data: group,
        canAdd: true,
        onAdd: () => {
          let cat = this.dataService.Config.CreateThreatCategory();
          group.AddThreatCategory(cat);
          this.createNodes();
          this.selectedNode = this.FindNodeOfObject(cat);
          this.selectedNode.isRenaming = true;
        },
        canRename: true,
        onRename: (val: string) => { group.Name = val; },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(group).subscribe(res => {
            if (res) {
              this.dataService.Config.DeleteThreatCategoryGroup(group); 
              if (this.selectedNode == node) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        children: [],
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = this.dataService.Config.GetThreatCategoryGroups();
          if (arr.findIndex(x => x.ID == group.ID) != 0) {
            let idx = arr.findIndex(x => x.ID == group.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            root.children.splice(idx, 0, root.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = this.dataService.Config.GetThreatCategoryGroups();
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
      name: () => this.translate.instant('pages.config.threatcategories.ThreatCategoryGroups'),
      canSelect: false,
      canAdd: true,
      icon: 'flash_on',
      onAdd: () => {
        let group = this.dataService.Config.CreateThreatCategoryGroup();
        this.createNodes();
        this.selectedNode = this.FindNodeOfObject(group);
        this.selectedNode.isRenaming = true;
      },
      children: [],
    };

    this.dataService.Config.GetThreatCategoryGroups().forEach(x => {
      let g = createGroup(x);
      x.ThreatCategories.forEach(y => g.children.push(createCategory(y, x, g, root)));
      root.children.push(g);
    });

    this.Nodes.push(root);
    NavTreeBase.TransferExpandedState(prevNodes, this.Nodes);
    this.nodeTreeChanged.emit(this.Nodes);
  }
}
