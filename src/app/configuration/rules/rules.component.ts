import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RuleTypes, ThreatRule, ThreatRuleGroup } from '../../model/threat-model';
import { NavTreeBase } from '../../shared/components/nav-tree/nav-tree-base';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss']
})
export class RulesComponent extends NavTreeBase implements OnInit {

  public get selectedThreatRuleGroup(): ThreatRuleGroup { return (this.selectedNode?.data instanceof ThreatRuleGroup ? this.selectedNode.data : null); }
  public get selectedThreatRule(): ThreatRule { return (this.selectedNode?.data instanceof ThreatRule ? this.selectedNode.data : null); }

  public get allGroupRulesActive(): boolean {
    if (this.selectedThreatRuleGroup) {
      return this.selectedThreatRuleGroup.ThreatRules.every(x => x.IsActive);
    }
    return false;
  }

  public get someGroupRulesActive(): boolean {
    if (this.selectedThreatRuleGroup && !this.allGroupRulesActive) {
      return this.selectedThreatRuleGroup.ThreatRules.length > 0 && this.selectedThreatRuleGroup.ThreatRules.some(x => x.IsActive);
    }
    return false;
  }

  constructor(public theme: ThemeService, private dataService: DataService, private dialog: DialogService, private translate: TranslateService) { 
    super();
    dataService.ConfigChanged.subscribe(x => this.createNodes());
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.createNodes();
    }, 100);
  }

  public OnRulesActiveChange(active: boolean) {
    if (this.selectedThreatRuleGroup) {
      this.selectedThreatRuleGroup.ThreatRules.forEach(x => x.IsActive = active);
    }
  }

  private createNodes() {
    const prevNodes = this.Nodes;
    this.Nodes = [];

    let createRule = (rule: ThreatRule, group: ThreatRuleGroup, groupNode: INavigationNode, groupNodes: INavigationNode[]): INavigationNode => {
      let node: INavigationNode = {
        name: () => rule.Name,
        canSelect: true,
        data: rule,
        canRename: true,
        onRename: (val: string) => { rule.Name = val; },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(rule).subscribe(res => {
            if (res) {
              this.dataService.Config.DeleteThreatRule(rule);
              if (this.selectedNode == node) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        canDuplicate: true,
        onDuplicate: () => {
          let cp = this.dataService.Config.CreateThreatRule(group, RuleTypes.DFD);
          cp.CopyFrom(rule.Data);
          cp.Name = cp.Name + '-Copy';
          this.dataService.Config.GetThreatRuleGroups().find(x => x.ThreatRules.includes(rule)).AddThreatRule(cp);
          this.createNodes();
          this.selectedNode = this.FindNodeOfObject(cp);
          this.selectedNode.isRenaming = true;
        },
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = group.Data['threatRuleIDs'];
          if (arr.findIndex(x => x == rule.ID) != 0) {
            let idx = arr.findIndex(x => x == rule.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = group.Data['threatRuleIDs'];
          if (arr.findIndex(x => x == rule.ID) != arr.length-1) {
            let idx = arr.findIndex(x => x == rule.ID);
            arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx+1, 1)[0]);
          }
        },
        canMoveToGroup: true,
        onMoveToGroups: () => {
          return groupNodes.filter(x => x != groupNode);
        },
        onMoveToGroup: (newGroup: INavigationNode) => {
          let arrName = 'threatRuleIDs';
          group.Data[arrName].splice(group.Data[arrName].indexOf(rule.ID), 1);
          newGroup.data.Data[arrName].push(rule.ID);
          this.createNodes();
        }
      };
      return node;
    };

    let createGroup = (group: ThreatRuleGroup, parentGroup: ThreatRuleGroup, parentGroupNode: INavigationNode, groupNodes: INavigationNode[]): INavigationNode => {
      let g: INavigationNode = {
        name: () => group.Name,
        canSelect: true,
        data: group,
        canAdd: true,
        addOptions: [this.translate.instant('general.Group'), this.translate.instant('general.ThreatRule')],
        onAdd: (val: string) => {
          let newObj = null;
          if (val == this.translate.instant('general.Group')) { newObj = this.dataService.Config.CreateThreatRuleGroup(group); }
          else { newObj = this.dataService.Config.CreateThreatRule(group, RuleTypes.DFD); }

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
              this.dataService.Config.DeleteThreatRuleGroup(group); 
              if (this.selectedNode == g) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        children: [],
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = parentGroup.Data['threatRuleGroupIDs'];
          if (arr.findIndex(x => x == group.ID) != 0) {
            let idx = arr.findIndex(x => x == group.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            parentGroupNode.children.splice(idx, 0, parentGroupNode.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = parentGroup.Data['threatRuleGroupIDs'];
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
          let arrName = 'threatRuleGroupIDs';
          parentGroup.Data[arrName].splice(parentGroup.Data[arrName].indexOf(group.ID), 1);
          newGroup.data.Data[arrName].push(group.ID);
          this.createNodes();
        }
      };

      group.SubGroups.forEach(x => {
        let subGroup = createGroup(x, group, g, groupNodes);
        g.children.push(subGroup);
      });

      group.ThreatRules.forEach(x => g.children.push(createRule(x, group, g, groupNodes)));
      
      groupNodes.push(g);
      return g;
    };

    let groupNodes = [];
    let libDFD = createGroup(this.dataService.Config.DFDThreatRuleGroups, null, null, groupNodes);
    libDFD.icon = 'compare_arrows'; 
    libDFD.canSelect = false;
    libDFD.canDelete = false;
    let libStencil = createGroup(this.dataService.Config.StencilThreatRuleGroups, null, null, groupNodes);
    libStencil.icon = 'view_module'; 
    libStencil.canSelect = false;
    libStencil.canDelete = false;
    libStencil.canAdd = false;
    let libComponent = createGroup(this.dataService.Config.ComponentThreatRuleGroups, null, null, groupNodes);
    libComponent.icon = 'code'; 
    libComponent.canSelect = false;
    libComponent.canDelete = false;
    libComponent.canAdd = false;

    this.Nodes.push(libDFD);
    this.Nodes.push(libStencil);
    this.Nodes.push(libComponent);
    NavTreeBase.TransferExpandedState(prevNodes, this.Nodes);
    this.nodeTreeChanged.emit(this.Nodes);
  }
}
