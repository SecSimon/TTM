import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { AssetGroup, LowMediumHighNumber, LowMediumHighNumberUtil, MyData } from '../../model/assets';
import { INavigationNode, NavTreeComponent } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { LocalStorageService, LocStorageKeys } from '../../util/local-storage.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-device-assets',
  templateUrl: './device-assets.component.html',
  styleUrls: ['./device-assets.component.scss']
})
export class DeviceAssetsComponent implements OnInit {

  private _selectedNode;

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
  }

  public selectedMyData: MyData = null;

  @Input()
  public assetGroup: AssetGroup;

  @ViewChild(NavTreeComponent) navTree: NavTreeComponent;

  public SetNavTreeData(nodes) {
    this.navTree.SetNavTreeData(nodes);
  }

  constructor(public theme: ThemeService, private dataService: DataService, private locStorage: LocalStorageService) { }

  ngOnInit(): void {
  }

  public DeleteMyData(data: MyData) {
    this.dataService.Project.DeleteMyData(data);
    if (this.selectedMyData == data) this.selectedMyData = null;
  }

  public AddMyData() {
    let data = this.dataService.Project.CreateMyData(this.assetGroup);
    this.selectedMyData = data;
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
