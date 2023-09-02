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
    this.arrays = [];
    this.charScope.StepProperties.forEach(x => this.arrays.push(this.charScope[x]));
  }

  public GetArray(arr: string) {
    return this.charScope.GetProperty(arr);
  }

  public GetArrayName(arr: string[]) {
    return 'pages.modeling.charscope.' + this.charScope.StepProperties[this.arrays.indexOf(arr)];
  }
}
