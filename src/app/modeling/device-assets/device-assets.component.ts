import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AssetGroup, LowMediumHighNumber, LowMediumHighNumberUtil, MyData } from '../../model/assets';
import { ViewElementBase } from '../../model/database';
import { DataFlow } from '../../model/dfd-model';
import { Diagram } from '../../model/diagram';
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

  constructor(public theme: ThemeService, public dataService: DataService, private locStorage: LocalStorageService, private dialog: DialogService, public elRef: ElementRef, 
    private translate: TranslateService, private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
  }

  public SelectObject(event, obj: AssetGroup|MyData) {
    event?.stopPropagation();
    this.selectionChanged.emit(obj);
  }

  public AddGroup(parent: AssetGroup, event) {
    let group: AssetGroup;
    if (parent.IsProjectAsset) group = this.dataService.Project.CreateAssetGroup(parent);
    else group = this.dataService.Config.CreateAssetGroup(parent);
    parent.ImpactCats?.forEach(x => group.ImpactCats.push(x));
    this.SelectObject(event, group);
    setTimeout(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'F2'}));
    }, 250);
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

  public GetArrayRange(array: any[], index, colCnt) {
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
    group.ImpactCats?.forEach(x => data.ImpactCats.push(x));
    this.selectedMyData = data;
    this.SelectObject(event, data);
    setTimeout(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'F2'}));
    }, 250);
  }

  public ResetNumbers() {
    // const dataArr = this.assetGroup.GetMyDataFlat();
    // for (let i = 0; i < dataArr.length; i++) {
    //   dataArr[i].Number = (i+1).toString();
    // }
    // const groupArr = this.assetGroup.GetGroupsFlat().filter(x => x.IsNewAsset);
    // for (let i = 0; i < groupArr.length; i++) {
    //   groupArr[i].Number = (dataArr.length+i+1).toString();
    // }

    let num = 1;
    const checkRec = (asset: AssetGroup) => {
      if (asset.IsNewAsset) asset.Number = (num++).toString();
      asset.AssociatedData.forEach(data => {
        if (data.IsNewAsset) data.Number = (num++).toString();
      });
      asset.SubGroups.forEach(x => checkRec(x));
    };

    checkRec(this.assetGroup);
  }

  public GetSensitivity(val: LowMediumHighNumber): string {
    return LowMediumHighNumberUtil.ToString(val);
  }

  public GetSensitivities() {
    return LowMediumHighNumberUtil.GetKeys();
  }

  private references = {};
  public GetReferences(data: MyData, dia: Diagram): ViewElementBase[] {
    if (!this.references[data.ID] || !this.references[data.ID][dia.ID]) {
      if (!this.references[data.ID]) this.references[data.ID] = {};
      this.references[data.ID][dia.ID] = dia.Elements.GetChildrenFlat().filter(x => {
        let res = x.GetProperty('ProcessedData')?.includes(data); 
        if (res && x instanceof DataFlow) {
          res = x.OverwriteDataProperties;
        }
        return res;
      });
    }

    return this.references[data.ID][dia.ID];
  }

  public GetAssetToolTip(data: MyData): string|null {
    const refInHW = this.dataService.Project.GetHWDiagrams().some(x => this.GetReferences(data, x)?.length > 0);
    const refInDF = this.dataService.Project.GetDFDiagrams().some(x => this.GetReferences(data, x)?.length > 0);
    let res = '';
    if (!refInHW && !refInDF) res = this.translate.instant('pages.modeling.deviceassets.noReferenceInDFHW');
    else if (!refInHW) res += this.translate.instant('pages.modeling.deviceassets.noReferenceInHW');
    else if (!refInDF) res += this.translate.instant('pages.modeling.deviceassets.noReferenceInDF');
    return res == '' ? null : res;
  }

  public OpenDiagram(dia) {
    const queryParams: Params = { viewID: dia.ID };
    this.router.navigate([], { relativeTo: this.activatedRoute, queryParams: queryParams, replaceUrl: true });
  }

  public OpenElement(dia, ref) {
    const queryParams: Params = { viewID: dia.ID, elementID: ref.ID };
    this.router.navigate([], { relativeTo: this.activatedRoute, queryParams: queryParams, replaceUrl: true });
  }

  public onAllowDrop(ev) {
    ev.preventDefault();
  }

  public onDrag(ev, obj: MyData|AssetGroup) {
    ev.dataTransfer.setData('ID', obj.ID);
    if (obj instanceof MyData) ev.dataTransfer.setData('type', 'MyData');
    else if (obj instanceof AssetGroup) ev.dataTransfer.setData('type', 'AssetGroup');
  }

  public onDrop(ev, target: AssetGroup) {
    ev.preventDefault();
    if (ev.dataTransfer.getData('type') == 'MyData') {
      const data = this.dataService.Project.GetMyData(ev.dataTransfer.getData('ID'));
      data.FindAssetGroup().RemoveMyData(data);
      target.AddMyData(data);
    }
    else if (ev.dataTransfer.getData('type') == 'AssetGroup') {
      const group = this.dataService.Project.GetAssetGroup(ev.dataTransfer.getData('ID'));
      if (!group.GetGroupsFlat().includes(target)) {
        group.Parent.RemoveAssetGroup(group);
        target.AddAssetGroup(group);
      }
    }
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
