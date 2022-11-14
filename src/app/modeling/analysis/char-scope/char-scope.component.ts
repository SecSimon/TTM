import { Component, Input, OnInit } from '@angular/core';
import { CharScope } from '../../../model/char-scope';
import { ThemeService } from '../../../util/theme.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DataService } from '../../../util/data.service';

@Component({
  selector: 'app-char-scope',
  templateUrl: './char-scope.component.html',
  styleUrls: ['./char-scope.component.scss']
})
export class CharScopeComponent implements OnInit {

  @Input() public charScope: CharScope;

  public selectedArray: string[];

  public arrays;
  public isEdtingArray: boolean[] = [];


  constructor(public theme: ThemeService, public dataService: DataService) { }

  ngOnInit(): void {
    this.arrays = [
      this.charScope.Application,
      this.charScope.Sector, 
      this.charScope.Function,  
      this.charScope.Features,
      this.charScope.Requirements,
      this.charScope.Criticality,
      this.charScope.LocEnv,
      this.charScope.Connectivity,
      this.charScope.TargetMarket,
      this.charScope.Standards,
      this.charScope.InvolvedPeople,
      this.charScope.Budget,
      this.charScope.Timeframe,
      this.charScope.ExpectedOutput,
      this.charScope.Assumptions
    ];
  }

  public GetArray(arr: string) {
    return this.charScope.GetProperty(arr);
  }

  public GetArrayName(arr: string[]) {
    let start = 'pages.modeling.charscope.';
    if (arr == this.charScope.Sector) return start + 'Sector';
    if (arr == this.charScope.Function) return start + 'Function';
    if (arr == this.charScope.Features) return start + 'Features';
    if (arr == this.charScope.Application) return start + 'Application';
    if (arr == this.charScope.Requirements) return start + 'Requirements';
    if (arr == this.charScope.Criticality) return start + 'Criticality';
    if (arr == this.charScope.LocEnv) return start + 'LocEnv';
    if (arr == this.charScope.Connectivity) return start + 'Connectivity';
    if (arr == this.charScope.TargetMarket) return start + 'TargetMarket';
    if (arr == this.charScope.Standards) return start + 'Standards';
    if (arr == this.charScope.InvolvedPeople) return start + 'InvolvedPeople';
    if (arr == this.charScope.Budget) return start + 'Budget';
    if (arr == this.charScope.Timeframe) return start + 'Timeframe';
    if (arr == this.charScope.ExpectedOutput) return start + 'ExpectedOutput';
    if (arr == this.charScope.Assumptions) return start + 'Assumptions';
  }
}
