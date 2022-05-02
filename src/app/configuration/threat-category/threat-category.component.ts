import { Component, Input, OnInit } from '@angular/core';
import { ImpactCategories, ImpactCategoryUtil, ThreatCategory } from '../../model/threat-model';

@Component({
  selector: 'app-threat-category',
  templateUrl: './threat-category.component.html',
  styleUrls: ['./threat-category.component.scss']
})
export class ThreatCategoryComponent implements OnInit {

  @Input() public threatCat: ThreatCategory;
  @Input() public canEdit: boolean = true;

  constructor() { }

  ngOnInit(): void {
  }

  public ImpactCatChanged(cat: ThreatCategory, impact: ImpactCategories) {
    const index = cat.ImpactCats.indexOf(impact);
    if (index >= 0) cat.ImpactCats.splice(index, 1);
    else cat.ImpactCats.push(impact);
  }

  public GetImpactCategories() {
    return ImpactCategoryUtil.GetKeys();
  }

  public GetImpactCategoryName(cat: ImpactCategories) {
    return ImpactCategoryUtil.ToString(cat);
  }
}
