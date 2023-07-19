import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { INote } from '../model/database';
import { Countermeasure, MitigationProcess, MitigationProcessStates, MitigationProcessStateUtil, MitigationStates, MitigationStateUtil } from '../model/mitigations';
import { NavTreeBase } from '../shared/components/nav-tree/nav-tree-base';
import { INavigationNode } from '../shared/components/nav-tree/nav-tree.component';
import { SideNavBase } from '../shared/components/side-nav/side-nav-base';
import { DataService } from '../util/data.service';
import { DialogService } from '../util/dialog.service';
import { LocalStorageService, LocStorageKeys } from '../util/local-storage.service';
import { ThemeService } from '../util/theme.service';

@Component({
  selector: 'app-mitigation-overview',
  templateUrl: './mitigation-overview.component.html',
  styleUrls: ['./mitigation-overview.component.scss']
})
export class MitigationOverviewComponent extends SideNavBase implements OnInit {
  private nodes: INavigationNode[];
  private _selectedNode: INavigationNode;

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
  }

  constructor(public theme: ThemeService, public dataService: DataService, private translate: TranslateService,
    private locStorage: LocalStorageService, private dialog: DialogService, private router: Router) { 
      super();
      if (!this.dataService.Project) {
        this.router.navigate(['/home'], {
          queryParams: { origin: 'mitigation' }
        });
      }
    }

  ngOnInit(): void {
    setTimeout(() => {
      this.createNodes();
      this.selectedNode = this.nodes[0];
    }, 100);
  }

  public IsProcess() {
    return this.selectedNode?.data instanceof MitigationProcess;
  }

  public IsMapping() {
    return this.selectedNode?.data instanceof Countermeasure;
  }

  public OnMappingProcessChange() {
    let data = this.selectedNode.data;
    if (data) {
      this.createNodes();
      this.selectedNode = NavTreeBase.FindNodeOfObject(data, this.nodes);
    }
  }

  public GetCheckedTasks(tasks: INote[]) {
    return tasks.filter(x => x.IsChecked).length;
  }

  public GetMitigationProcessStates() {
    return MitigationProcessStateUtil.GetMitigationStates();
  }

  public GetMitigationProcessStateName(ms: MitigationProcessStates) {
    return MitigationProcessStateUtil.ToString(ms);
  }

  public GetMitigationStates() {
    return MitigationStateUtil.GetMitigationStates();
  }

  public GetMitigationStateName(ts: MitigationStates) {
    return MitigationStateUtil.ToString(ts);
  }

  public GetSplitSize(splitter: number, gutter: number, defaultSize: number) {
    let size = this.locStorage.Get(LocStorageKeys.PAGE_MITIGATION_SPLIT_SIZE_X + splitter.toString());
    if (size != null) return Number(JSON.parse(size)[gutter]);
    return defaultSize;
  }

  public OnSplitSizeChange(event, splitter: number) {
    this.locStorage.Set(LocStorageKeys.PAGE_MITIGATION_SPLIT_SIZE_X + splitter.toString(), JSON.stringify(event['sizes']));
  }

  public createNodes() {
    const prevNodes = this.nodes;
    this.nodes = [];
    const pf = this.dataService.Project;

    const createCountermeasure = (cm: Countermeasure, groupNode: INavigationNode): INavigationNode => {
      let node: INavigationNode = {
        name: () => 'CM' + cm.Number + ') ' + cm.Name,
        canSelect: true,
        data: cm,
        canRename: true,
        onRename: (val: string) => { cm.Name = val; },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(cm).subscribe(res => {
            if (res) {
              pf.DeleteCountermeasure(cm);
              if (this.selectedNode == node) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = pf.GetCountermeasures();
          let arrProcess = groupNode.children?.map(x => x.data);
          let idxProcess = arrProcess.findIndex(x => x.ID == cm.ID);
          if (idxProcess != 0) {
            let newIndex = arr.findIndex(x => x.ID == arrProcess[idxProcess-1].ID);
            pf.MoveItemCountermeasures(arr.findIndex(x => x.ID == cm.ID), newIndex);
            groupNode.children.splice(idxProcess, 0, groupNode.children.splice(idxProcess-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = pf.GetCountermeasures();
          let arrProcess = groupNode.children?.map(x => x.data);
          let idxProcess = arrProcess.findIndex(x => x.ID == cm.ID);
          if (idxProcess != arrProcess.length-1) {
            let newIndex = arr.findIndex(x => x.ID == arrProcess[idxProcess+1].ID);
            pf.MoveItemCountermeasures(arr.findIndex(x => x.ID == cm.ID), newIndex);
            groupNode.children.splice(idxProcess, 0, groupNode.children.splice(idxProcess+1, 1)[0]);
          }
        }
      };
      return node;
    };

    const createProcess = (proc: MitigationProcess, groupNode: INavigationNode): INavigationNode => {
      let node: INavigationNode = {
        name: () => 'MP' + proc.Number + ') ' + proc.Name,
        canSelect: true,
        data: proc,
        canRename: true,
        onRename: (val: string) => { proc.Name = val; },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(proc).subscribe(res => {
            if (res) {
              pf.DeleteMitigationProcess(proc);
              if (this.selectedNode == node) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = pf.GetMitigationProcesses();
          const idx = arr.findIndex(x => x.ID == proc.ID);
          if (idx != 0) {
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            const idxNodes = groupNode.children.findIndex(x => x.data == proc);
            groupNode.children.splice(idxNodes, 0, groupNode.children.splice(idxNodes-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = pf.GetMitigationProcesses();
          const idx = arr.findIndex(x => x.ID == proc.ID);
          if (idx != arr.length-1) {
            arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
            const idxNodes = groupNode.children.findIndex(x => x.data == proc);
            groupNode.children.splice(idxNodes, 0, groupNode.children.splice(idxNodes+1, 1)[0]);
          }
        },
        children: []
      };

      pf.GetCountermeasures().filter(x => x.MitigationProcess == proc).forEach(x => node.children.push(createCountermeasure(x, node)));

      return node;
    };

    const root: INavigationNode = {
      name: () => this.translate.instant('pages.modeling.mitigationoverview.MitigationProcesses'),
      icon:'security',
      canSelect: true,
      canAdd: true,
      hasMenu: true,
      onAdd: () => {
        let newObj = pf.CreateMitigationProcess();
        this.createNodes();
        this.selectedNode = NavTreeBase.FindNodeOfObject(newObj, this.nodes);
        this.selectedNode.isRenaming = true;
      },
      children: []
    };

    const na: INavigationNode = {
      name: () => this.translate.instant('pages.modeling.mitigationoverview.NotAssignedCountermeasures'),
      canSelect: false,
      children: []
    };
    pf.GetCountermeasuresApplicable().filter(x => x.MitigationProcess == null).forEach(x => na.children.push(createCountermeasure(x, na)));
    if (na.children.length > 0) root.children.push(na);

    const rej: INavigationNode = {
      name: () => this.translate.instant('pages.modeling.mitigationoverview.RejectedCountermeasures'),
      canSelect: false,
      children: [],
      isExpanded: false
    };
    pf.GetCountermeasuresNotApplicable().filter(x => x.MitigationProcess == null).forEach(x => rej.children.push(createCountermeasure(x, rej)));
    if (rej.children.length > 0) root.children.push(rej);

    pf.GetMitigationProcesses().forEach(x => root.children.push(createProcess(x, root)));
    this.nodes.push(root);
    
    NavTreeBase.TransferExpandedState(prevNodes, this.nodes);
    this.navTree.SetNavTreeData(this.nodes);
  }
}
