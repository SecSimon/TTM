import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { ObjImpact } from '../../../model/obj-impact';
import { DataService } from '../../../util/data.service';
import { ThemeService } from '../../../util/theme.service';

@Component({
  selector: 'app-obj-impact',
  templateUrl: './obj-impact.component.html',
  styleUrls: ['./obj-impact.component.scss']
})
export class ObjImpactComponent implements OnInit {

  @Input() public objImpact: ObjImpact;

  public selectedArray: string[];

  public arrays;
  public isEdtingArray: boolean[] = [];

  constructor(public theme: ThemeService, public dataService: DataService) { }

  ngOnInit(): void {
    this.arrays = [
      this.objImpact.DeviceGoals, 
      this.objImpact.BusinessGoals, 
      this.objImpact.BusinessImpact,
    ];
  }

  public GetArray(arr: string) {
    return this.objImpact.GetProperty(arr);
  }

  public GetArrayName(arr: string[]) {
    let start = 'pages.modeling.objimpact.';
    if (arr == this.objImpact.DeviceGoals) return start + 'DeviceGoals';
    if (arr == this.objImpact.BusinessGoals) return start + 'BusinessGoals';
    if (arr == this.objImpact.BusinessImpact) return start + 'BusinessImpact';
  }

  public OnDeleteItem(item: string, selectedArray: string[]) {
    const index = selectedArray.indexOf(item);
    if (index >= 0) selectedArray.splice(index, 1);
  }

  public OnListKeyDown(event: KeyboardEvent, arr: string[]) {
    if (event.key == 'Enter') {
      arr.push(event.target['value']);
      event.target['value'] = '';
    }
  }

  public OnRenameItem(event, items: string[], index: number) {
    if (event.key === 'Enter' || event.type === 'focusout') {
      items[index] = event.target['value'];
      this.isEdtingArray[index] = false;
    }
  }

  public drop(event: CdkDragDrop<string[]>, selectedArray: string[]) {
    moveItemInArray(selectedArray, event.previousIndex, event.currentIndex);
  }
}
