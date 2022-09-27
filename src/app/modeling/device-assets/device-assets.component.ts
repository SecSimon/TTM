import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AssetGroup, LowMediumHighNumber, LowMediumHighNumberUtil, MyData } from '../../model/assets';
import { INavigationNode, NavTreeComponent } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { LocalStorageService, LocStorageKeys } from '../../util/local-storage.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-device-assets',
  templateUrl: './device-assets.component.html',
  styleUrls: ['./device-assets.component.scss']
})
export class DeviceAssetsComponent implements OnInit {

  private _selectedNode;
  private _selectedObject;

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
  }

  public selectedMyData: MyData = null;

  @Input()
  public assetGroup: AssetGroup;

  @Input()
  public hideButtons: boolean = false;

  @ViewChild(NavTreeComponent) navTree: NavTreeComponent;

  public SetNavTreeData(nodes) {
    this.navTree.SetNavTreeData(nodes);
  }

  public get selectedObject(): AssetGroup|MyData { return this._selectedObject; } 
  @Input() 
  public set selectedObject(obj: AssetGroup|MyData) {
    this._selectedObject = obj;
  }
  
  @Output()
  public selectionChanged = new EventEmitter<AssetGroup|MyData>();

  public get assetGroupBase(): AssetGroup { 
    if (this.assetGroup.SubGroups.length == 0) return null;
    return this.assetGroup.SubGroups[0]; 
  }
  public get assetGroupsCols(): AssetGroup[] {
    if (this.assetGroup.SubGroups.length <= 1) return [];
    return this.assetGroup.SubGroups.slice(1);
  }

  public readonly bgColorDark = '#424242';
  public readonly bgColorLight = '#e7e5e5';

  constructor(public theme: ThemeService, private dataService: DataService, private locStorage: LocalStorageService, private dialog: DialogService, public elRef: ElementRef) { }

  ngOnInit(): void {
  }

  public SelectObject(event, obj: AssetGroup|MyData) {
    event?.stopPropagation();
    this.selectionChanged.emit(obj);
  }

  public AddGroup(parent: AssetGroup, event) {
    let group;
    if (parent.IsProjectAsset) group = this.dataService.Project.CreateAssetGroup(parent);
    else group = this.dataService.Config.CreateAssetGroup(parent);
    this.SelectObject(event, group);
  }

  public DeleteGroup(obj: AssetGroup) {
    this.dialog.OpenDeleteObjectDialog(obj).subscribe(res => {
      if (res) {
        if (this.selectedObject == obj) this.SelectObject(null ,null);
        if (obj.IsProjectAsset) this.dataService.Project.DeleteAssetGroup(obj);
        else this.dataService.Config.DeleteAssetGroup(obj);
      }
    });
  }

  private newGroupDict = {};
  public IsNewAssetGroup(group: AssetGroup) {
    if (!(group.ID in this.newGroupDict)) this.newGroupDict[group.ID] = this.dataService.Config.AssetGroups.GetGroupsFlat().find(x => x.Name == group.Name && x.Parent != null && x.Parent?.Name == group.Parent?.Name) == null ? true : false;

    return this.newGroupDict[group.ID];
  }

  private colArray = [];
  public GetColArray(num) {
    if (num != this.colArray.length) this.colArray = Array(num).fill(0).map((x,i)=>i); 
    return this.colArray;
  }

  public GetArrayRange(array: AssetGroup[]|MyData[], index, colCnt) {
    if (array.length > 0 && colCnt > 1) {
      const size = Math.round(array.length / colCnt);
      //console.log(array.length, index, colCnt, size);
      if (index == colCnt-1) return array.slice(size*index);
      else return array.slice(size*index, size*(index+1));
    }
    
    return array;
  }

  public GetColumnWidth() {
    const gapRatio = 1/5;
    return (100 / ((1+gapRatio)*this.assetGroupsCols.length+gapRatio)).toString() + '%';
  }

  public GetGapWidth() {
    const gapRatio = 1/5;
    return (Number(this.GetColumnWidth().replace('%', '')) * gapRatio).toString() + '%';
  }

  public DeleteMyData(data: MyData) {
    this.dataService.Project.DeleteMyData(data);
    if (this.selectedMyData == data) this.selectedMyData = null;
    if (this.selectedObject == data) this.SelectObject(null, null);
  }

  public AddMyData(group: AssetGroup, event) {
    let data = this.dataService.Project.CreateMyData(group);
    this.selectedMyData = data;
    this.SelectObject(event, data);
  }

  public GetSensitivity(val: LowMediumHighNumber): string {
    return LowMediumHighNumberUtil.ToString(val);
  }

  public GetSensitivities() {
    return LowMediumHighNumberUtil.GetKeys();
  }

  public GetSelectedTabIndex() {
    let index = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_ASSETS_TAB_INDEX);
    if (index != null) return index;
    else return 0;
  }

  public SetSelectedTabIndex(event) {
    this.selectedNode = null;
    this.SelectObject(null, null);
    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_ASSETS_TAB_INDEX, event);
  }

  public GetSplitSize(splitter: number, gutter: number, defaultSize: number) {
    let size = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_ASSETS_SPLIT_SIZE_X + splitter.toString());
    if (size != null) return Number(JSON.parse(size)[gutter]);
    return defaultSize;
  }

  public OnSplitSizeChange(event, splitter: number) {
    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_ASSETS_SPLIT_SIZE_X + splitter.toString(), JSON.stringify(event['sizes']));
  }
}
