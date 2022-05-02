import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { LowMediumHighNumber, LowMediumHighNumberUtil } from '../../../model/assets';
import { DeviceThreat } from '../../../model/device-threat';
import { ThreatCategory, ThreatCategoryGroup } from '../../../model/threat-model';
import { NavTreeBase } from '../../../shared/components/nav-tree/nav-tree-base';
import { INavigationNode, NavTreeComponent } from '../../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../../util/data.service';
import { LocalStorageService, LocStorageKeys } from '../../../util/local-storage.service';
import { ThemeService } from '../../../util/theme.service';

@Component({
  selector: 'app-threat-identification',
  templateUrl: './threat-identification.component.html',
  styleUrls: ['./threat-identification.component.scss']
})
export class ThreatIdentificationComponent implements OnInit {
  private nodes: INavigationNode[];
  private _selectedNode;

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
    this.selectedThreat = null;
  }

  @Input() get deviceThreats(): DeviceThreat[] { return this.dataService.Project.GetDeviceThreats(); }

  public get selectedThreatCat(): ThreatCategory {
    if (this.selectedNode && this.selectedNode.data instanceof ThreatCategory) return this.selectedNode.data;
  }

  public currentDeviceThreats(): DeviceThreat[] {
    return this.deviceThreats.filter(x => x.ThreatCategory?.ID == this.selectedThreatCat?.ID);
  }
  public selectedThreat: DeviceThreat = null;

  @ViewChild('catTree') navTree: NavTreeComponent;

  public SetNavTreeData(nodes) {
    this.navTree.SetNavTreeData(nodes);
  }

  constructor(public theme: ThemeService, private dataService: DataService, private locStorage: LocalStorageService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createNodes();
    }, 10);
  }

  public DeleteThreat(dt: DeviceThreat) {
    this.dataService.Project.DeleteDeviceThreat(dt);
    if (this.selectedThreat == dt) this.selectedThreat = null;
  }

  public AddThreat() {
    let dt = this.dataService.Project.CreateDeviceThreat(this.selectedThreatCat);
    this.selectedThreat = dt;
  }

  public GetLMHValues() {
    return LowMediumHighNumberUtil.GetKeys();
  }

  public GetLMHName(type: LowMediumHighNumber) {
    return LowMediumHighNumberUtil.ToString(type);
  }

  public OnTabChange() {
    this.selectedNode = null;
    this.selectedThreat = null;
  }

  public drop(event: CdkDragDrop<string[]>, selectedArray) {
    moveItemInArray(selectedArray, event.previousIndex, event.currentIndex);
  }

  public dropWrapper(event: CdkDragDrop<string[]>, selectedArray) {
    const prev = this.deviceThreats.indexOf(selectedArray[event.previousIndex]);
    const curr = this.deviceThreats.indexOf(selectedArray[event.currentIndex]);
    moveItemInArray(this.deviceThreats, prev, curr);
  }

  public GetSelectedTabIndex() {
    let index = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_THREAT_IDENT_TAB_INDEX);
    if (index != null) return index;
    else return 0;
  }

  public SetSelectedTabIndex(event) {
    this.selectedNode = null;
    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_THREAT_IDENT_TAB_INDEX, event);
  }

  public GetSplitSize(splitter: number, gutter: number, defaultSize: number) {
    let size = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_ASSETS_SPLIT_SIZE_X + splitter.toString());
    if (size != null) return Number(JSON.parse(size)[gutter]);
    return defaultSize;
  }

  public OnSplitSizeChange(event, splitter: number) {
    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_ASSETS_SPLIT_SIZE_X + splitter.toString(), JSON.stringify(event['sizes']));
  }

  private createNodes() {
    const prevNodes = this.nodes;
    this.nodes = [];

    let createCategory = (cat: ThreatCategory, group: ThreatCategoryGroup, groupNode: INavigationNode, root: INavigationNode): INavigationNode => {
      let node: INavigationNode = {
        name: () => cat.Name,
        canSelect: true,
        data: cat
      };
      return node;
    };

    let createGroup = (group: ThreatCategoryGroup): INavigationNode => {
      let node: INavigationNode = {
        name: () => group.Name,
        canSelect: false,
        data: group,
        children: []
      };

      return node;
    };
    
    let root: INavigationNode = {
      name: () => 'Threat Category Groups',
      canSelect: false,
      icon: 'flash_on',
      children: [],
    };

    this.dataService.Config.GetThreatCategoryGroups().forEach(x => {
      let g = createGroup(x);
      x.ThreatCategories.forEach(y => g.children.push(createCategory(y, x, g, root)));
      root.children.push(g);
    });

    this.nodes.push(root);
    NavTreeBase.TransferExpandedState(prevNodes, this.nodes);
    this.SetNavTreeData(this.nodes);
  }
}
