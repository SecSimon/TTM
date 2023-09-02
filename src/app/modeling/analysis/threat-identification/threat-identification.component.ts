import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { AssetGroup, LowMediumHighNumber, LowMediumHighNumberUtil, MyData } from '../../../model/assets';
import { SystemThreat } from '../../../model/system-threat';
import { Device, MobileApp } from '../../../model/system-context';
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
  private assetNodes: INavigationNode[];
  private categoryNodes: INavigationNode[];
  private _selectedAssetNode;
  private _selectedCategoryNode;
  private _selectedThreat = null;

  public get systemThreats(): SystemThreat[] { return this.dataService.Project.GetSystemThreats(); }

  public get selectedThreat(): SystemThreat { return this._selectedThreat; }
  public set selectedThreat(val: SystemThreat) {
    this._selectedThreat = val;
    if (val && val.ThreatCategory) {
      this.selectedCategoryNode = NavTreeBase.FlattenNodes(this.categoryNodes).find(x => x.data == val.ThreatCategory);
      if (this.catsTree) this.catsTree.checkedNodes = [this.selectedCategoryNode];
    }
    else {
      if (this.catsTree) this.catsTree.checkedNodes = null;
    }
    if (val && val.AffectedAssetObjects?.length > 0) {
      const nodes = NavTreeBase.FlattenNodes(this.assetNodes);
      this.selectedAssetNode = nodes.find(x => x.data == val.AffectedAssetObjects[0]);
      if (this.assetsTree) this.assetsTree.checkedNodes = nodes.filter(x => val.AffectedAssetObjects.includes(x.data));
    }
    else {
      if (this.assetsTree) this.assetsTree.checkedNodes = null;
    }
  }

  public get selectedAssetNode(): INavigationNode { return this._selectedAssetNode; }
  public set selectedAssetNode(val: INavigationNode) {
    this._selectedAssetNode = val;
  }

  public get selectedAssetObject(): AssetGroup|MyData {
    return this.selectedAssetNode?.data;
  }

  public get selectedCategoryNode(): INavigationNode { return this._selectedCategoryNode; }
  public set selectedCategoryNode(val: INavigationNode) {
    this._selectedCategoryNode = val;
  }

  public get selectedCategory(): ThreatCategory {
    return this._selectedCategoryNode?.data;
  }
  @ViewChild('assetsTree') assetsTree: NavTreeComponent;
  @ViewChild('catsTree') catsTree: NavTreeComponent;

  constructor(public theme: ThemeService, public dataService: DataService, private locStorage: LocalStorageService) { }

  public OnCheckedAssetNodesChanged(event) {
    if (this.selectedThreat) this.selectedThreat.AffectedAssetObjects = event?.map(x => x.data);
  }

  public OnCheckedCategoryChanged(event) {
    if (this.selectedThreat) this.selectedThreat.ThreatCategory = event?.length == 1 ? event[0].data : null;
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createAssetNodes();
      this.createCategoryNodes();
    }, 10);
  }

  public DeleteThreat(dt: SystemThreat) {
    this.dataService.Project.DeleteSystemThreat(dt);
    if (this.selectedThreat == dt) this.selectedThreat = null;
  }

  public AddThreat() {
    let dt = this.dataService.Project.CreateSystemThreat(this.selectedCategory);
    this.selectedThreat = dt;
    setTimeout(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'F2'}));
    }, 250);
  }

  public ResetNumbers() {
    const arr = this.systemThreats;
    for (let i = 0; i < arr.length; i++) {
      arr[i].Number = (i+1).toString();
    }
  }

  public GetLMHValues() {
    return LowMediumHighNumberUtil.GetKeys();
  }

  public GetLMHName(type: LowMediumHighNumber) {
    return LowMediumHighNumberUtil.ToString(type);
  }

  public drop(event: CdkDragDrop<string[]>, selectedArray) {
    moveItemInArray(selectedArray, event.previousIndex, event.currentIndex);
  }

  public dropWrapper(event: CdkDragDrop<string[]>, selectedArray) {
    const prev = this.systemThreats.indexOf(selectedArray[event.previousIndex]);
    const curr = this.systemThreats.indexOf(selectedArray[event.currentIndex]);
    moveItemInArray(this.systemThreats, prev, curr);
  }

  public GetSplitSize(splitter: number, gutter: number, defaultSize: number) {
    let size = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_ASSETS_SPLIT_SIZE_X + splitter.toString());
    if (size != null) return Number(JSON.parse(size)[gutter]);
    return defaultSize;
  }

  public OnSplitSizeChange(event, splitter: number) {
    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_ASSETS_SPLIT_SIZE_X + splitter.toString(), JSON.stringify(event['sizes']));
  }

  private createAssetNodes() {
    const prevNodes = this.assetNodes;
    this.assetNodes = [];

    let file = this.dataService.Project;

    let createData = (data: MyData, parentGroup: AssetGroup): INavigationNode => {
      let d: INavigationNode = {
        name: () => data.Name,
        canSelect: true,
        canCheck: true,
        checkEnabled: true,
        isChecked: false,
        isInactive: () => { return !parentGroup.IsActive; },
        data: data,
        iconAlignLeft: true,
        icon: 'description'
      };

      return d;
    };

    let createGroup = (group: AssetGroup, groupNodes: INavigationNode[]): INavigationNode => {
      let g: INavigationNode = {
        name: () => group.Name,
        canSelect: true,
        canCheck: true,
        checkEnabled: true,
        isChecked: false,
        isInactive: () => { return !group.IsActive; },
        data: group,
        children: []
      };

      if (g.isExpanded == null && !group.IsActive) g.isExpanded = false;

      group.AssociatedData.forEach(x => {
        let data = createData(x, group);
        g.children.push(data);
      });

      group.SubGroups.forEach(x => {
        let subGroup = createGroup(x, groupNodes);
        g.children.push(subGroup);
      });

      groupNodes.push(g);
      return g;
    };

    
    let groupNodes = [];
    if (file.GetProjectAssetGroup()) {
      let root = createGroup(file.GetProjectAssetGroup(), groupNodes);
      root.canSelect = root.canCheck = false;
      root.icon = AssetGroup.Icon;
      root.iconAlignLeft = false;
      root.name = () => { return 'Assets'; }
      root.hasMenu = true;
      this.assetNodes.push(root);
    }
    file.GetDevices().filter(x => x.AssetGroup != null).forEach(dev => {
      let root = createGroup(dev.AssetGroup, groupNodes);
      root.canSelect = root.canCheck = false;
      root.icon = Device.Icon;
      root.iconAlignLeft = false;
      root.name = () => { return dev.Name; }
      root.hasMenu = true;
      this.assetNodes.push(root);
    });

    file.GetMobileApps().filter(x => x.AssetGroup != null).forEach(app => {
      let root = createGroup(app.AssetGroup, groupNodes);
      root.icon = MobileApp.Icon;
      root.iconAlignLeft = false;
      root.name = () => { return app.Name; }
      root.hasMenu = true;
      this.assetNodes.push(root);
    });

    NavTreeBase.TransferExpandedState(prevNodes, this.assetNodes);
    this.assetsTree.SetNavTreeData(this.assetNodes);
  }

  private createCategoryNodes() {
    const prevNodes = this.categoryNodes;
    this.categoryNodes = [];

    let createCategory = (cat: ThreatCategory): INavigationNode => {
      let node: INavigationNode = {
        name: () => cat.Name,
        canSelect: true,
        canCheck: true,
        checkEnabled: true,
        isChecked: false,
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
      hasMenu: true,
      children: [],
    };

    this.dataService.Config.GetThreatCategoryGroups().forEach(x => {
      let g = createGroup(x);
      x.ThreatCategories.forEach(y => g.children.push(createCategory(y)));
      root.children.push(g);
    });

    this.categoryNodes.push(root);

    NavTreeBase.TransferExpandedState(prevNodes, this.categoryNodes);
    this.catsTree.SetNavTreeData(this.categoryNodes);
  }
}
