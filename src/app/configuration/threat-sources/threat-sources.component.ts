import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThreatActor } from '../../model/threat-source';

import { NavTreeBase } from '../../shared/components/nav-tree/nav-tree-base';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-threat-sources',
  templateUrl: './threat-sources.component.html',
  styleUrls: ['./threat-sources.component.scss']
})
export class ThreatSourcesComponent extends NavTreeBase implements OnInit {

  public get selectedThreatActor(): ThreatActor { return (this.selectedNode?.data instanceof ThreatActor ? this.selectedNode.data : null); }

  constructor(public theme: ThemeService, private dataService: DataService, private dialog: DialogService, private translate: TranslateService) {
    super();
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.createNodes();
    }, 100);
  }

  private createNodes() {
    const prevNodes = this.Nodes;
    this.Nodes = [];

    let createActor = (actor: ThreatActor, root: INavigationNode) => {
      let node: INavigationNode = {
        name: () => actor.Name,
        canSelect: true,
        data: actor,
        canRename: true,
        onRename: (val: string) => { actor.Name = val; },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(actor).subscribe(res => {
            if (res) {
              this.dataService.Config.DeleteThreatActor(actor); 
              if (this.selectedNode == node) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = this.dataService.Config.GetThreatActors();
          if (arr.findIndex(x => x.ID == actor.ID) != 0) {
            let idx = arr.findIndex(x => x.ID == actor.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            root.children.splice(idx, 0, root.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = this.dataService.Config.GetThreatActors();
          if (arr.findIndex(x => x.ID == actor.ID) != arr.length-1) {
            let idx = arr.findIndex(x => x.ID == actor.ID);
            arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
            root.children.splice(idx, 0, root.children.splice(idx+1, 1)[0]);
          }
        }
      };

      return node;
    };
    
    let root: INavigationNode = {
      name: () => this.translate.instant('general.ThreatSources'),
      canSelect: false,
      canAdd: true,
      icon: 'portrait',
      onAdd: () => {
        let ta = this.dataService.Config.CreateThreatActor();
        this.createNodes();
        this.selectedNode = this.FindNodeOfObject(ta);
        this.selectedNode.isRenaming = true;
      },
      children: [],
    };

    this.dataService.Config.GetThreatActors().forEach(x => root.children.push(createActor(x, root)));

    this.Nodes.push(root);
    NavTreeBase.TransferExpandedState(prevNodes, this.Nodes);
    this.nodeTreeChanged.emit(this.Nodes);
  }
}
