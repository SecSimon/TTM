import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { LowMediumHighNumberUtil, LowMediumHighNumber } from '../../model/assets';
import { ThreatActor } from '../../model/threat-source';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-threat-actor',
  templateUrl: './threat-actor.component.html',
  styleUrls: ['./threat-actor.component.scss']
})
export class ThreatActorComponent implements OnInit {
  public isEdtingArray: boolean[] = [];

  @Input() public threatActor: ThreatActor;

  constructor(public theme: ThemeService) { }

  ngOnInit(): void {
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

  public drop(event: CdkDragDrop<string[]>, selectedArray) {
    moveItemInArray(selectedArray, event.previousIndex, event.currentIndex);
  }

  public GetLMHValues() {
    return LowMediumHighNumberUtil.GetKeys();
  }

  public GetLMHName(type: LowMediumHighNumber) {
    return LowMediumHighNumberUtil.ToString(type);
  }
}
