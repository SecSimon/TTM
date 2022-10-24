import { Component, Input, OnInit } from '@angular/core';
import { LowMediumHighNumberUtil, LowMediumHighNumber } from '../../../model/assets';
import { DeviceThreat } from '../../../model/device-threat';
import { ImpactCategories, ImpactCategoryUtil, ThreatCategory } from '../../../model/threat-model';
import { DataService } from '../../../util/data.service';

@Component({
  selector: 'app-device-threat',
  templateUrl: './device-threat.component.html',
  styleUrls: ['./device-threat.component.scss']
})
export class DeviceThreatComponent implements OnInit {
  @Input() public deviceThreat: DeviceThreat;
  @Input() public showThreatCat = false;

  constructor(public dataService: DataService) { }

  ngOnInit(): void {
  }

  public GetThreatCategories() {
    return this.dataService.Config.GetThreatCategories();
  }

  public GetLMHValues() {
    return LowMediumHighNumberUtil.GetKeys();
  }

  public GetLMHName(type: LowMediumHighNumber) {
    return LowMediumHighNumberUtil.ToString(type);
  }

  public ImpactCatChanged(cats: ImpactCategories[], impact: ImpactCategories) {
    const index = cats.indexOf(impact);
    if (index >= 0) cats.splice(index, 1);
    else cats.push(impact);
  }

  public GetImpactCategories() {
    return ImpactCategoryUtil.GetKeys();
  }

  public GetImpactCategoryName(cat: ImpactCategories) {
    return ImpactCategoryUtil.ToString(cat);
  }
}
