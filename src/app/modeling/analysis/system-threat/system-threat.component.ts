import { Component, Input, OnInit } from '@angular/core';
import { LowMediumHighNumberUtil, LowMediumHighNumber } from '../../../model/assets';
import { SystemThreat } from '../../../model/system-threat';
import { ImpactCategories, ImpactCategoryUtil } from '../../../model/threat-model';
import { DataService } from '../../../util/data.service';

@Component({
  selector: 'app-system-threat',
  templateUrl: './system-threat.component.html',
  styleUrls: ['./system-threat.component.scss']
})
export class SystemThreatComponent implements OnInit {
  @Input() public systemThreat: SystemThreat;
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

  public NumberAlreadyExists() {
    return this.dataService.Project.GetSystemThreats().some(x => x.Number == this.systemThreat.Number && x.ID != this.systemThreat.ID);
  }
}
