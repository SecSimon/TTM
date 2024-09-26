import { Component, Input, OnInit, Optional } from '@angular/core';
import { AssetGroup, LowMediumHighNumber, LowMediumHighNumberUtil, MyData } from '../../model/assets';
import { IKeyValue } from '../../model/database';
import { ImpactCategories, ImpactCategoryUtil } from '../../model/threat-model';
import { DataService } from '../../util/data.service';

@Component({
  selector: 'app-mydata',
  templateUrl: './mydata.component.html',
  styleUrls: ['./mydata.component.scss']
})
export class MyDataComponent implements OnInit {
  private assetGroups: IKeyValue[];

  @Input() public myData: MyData;
  @Input() public showAssetGroup = false;

  constructor(@Optional() mydata: MyData, public dataService: DataService) { 
    if (mydata) {
      this.myData = mydata;
      this.showAssetGroup = true;
    }
  }

  ngOnInit(): void {
    this.assetGroups = [];
    if (this.myData.IsProjectData) {
      const glob = this.dataService.Project.GetProjectAssetGroup();
      if (glob) {
        const g: IKeyValue = {
          Key: glob.Name,
          Value: [glob, ...glob.GetGroupsFlat()]
        }
        this.assetGroups.push(g);
      }
      this.dataService.Project.GetDevices().filter(x => x.AssetGroup).forEach(dev => {
        let g: IKeyValue = {
          Key: dev.Name,
          Value: [dev.AssetGroup, ...dev.AssetGroup.GetGroupsFlat()]
        }
        this.assetGroups.push(g);
      });
      this.dataService.Project.GetMobileApps().filter(x => x.AssetGroup).forEach(app => {
        let g: IKeyValue = {
          Key: app.Name,
          Value: [app.AssetGroup, ...app.AssetGroup.GetGroupsFlat()]
        }
        this.assetGroups.push(g);
      });
    }
    else {
      this.assetGroups.push({
        Key: 'Assets',
        Value: [this.dataService.Config.AssetGroups, ...this.dataService.Config.AssetGroups.GetGroupsFlat()]
      });
    }
  }

  public SetAssetGroup(asset: AssetGroup) {
    let prev = this.GetAssetGroup();
    if (prev) prev.RemoveMyData(this.myData);
    asset.AddMyData(this.myData);
  }

  public GetAssetGroups() {
    return this.assetGroups;
  }

  public GetAssetGroup() {
    return this.myData.FindAssetGroup();
  }

  public GetSensitivity(val: LowMediumHighNumber): string {
    return LowMediumHighNumberUtil.ToString(val);
  }

  public GetSensitivities() {
    return LowMediumHighNumberUtil.GetKeys();
  }

  public ImpactCatChanged(data: MyData, impact: ImpactCategories) {
    const index = data.ImpactCats.indexOf(impact);
    if (index >= 0) data.ImpactCats.splice(index, 1);
    else data.ImpactCats.push(impact);
  }

  public GetImpactCategories() {
    return ImpactCategoryUtil.GetKeys();
  }

  public GetImpactCategoryName(cat: ImpactCategories) {
    return ImpactCategoryUtil.ToString(cat);
  }
}
