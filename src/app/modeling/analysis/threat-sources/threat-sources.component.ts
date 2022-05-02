import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { LowMediumHighNumber, LowMediumHighNumberUtil } from '../../../model/assets';
import { IKeyValue } from '../../../model/database';
import { IThreatSource, ThreatSources } from '../../../model/threat-source';
import { StringExtension } from '../../../util/string-extension';
import { ThemeService } from '../../../util/theme.service';

@Component({
  selector: 'app-threat-sources',
  templateUrl: './threat-sources.component.html',
  styleUrls: ['./threat-sources.component.scss']
})
export class ThreatSourcesComponent implements OnInit {

  @Input() public threatSources: ThreatSources;

  public selectedSource: IThreatSource;

  public isEdtingArray: boolean[] = [];

  constructor(public theme: ThemeService) { }

  ngOnInit(): void {
  }

  public AddSource() {
    let name = StringExtension.FindUniqueName('Threat Source', this.threatSources.Sources.map(x => x.Name));
    this.threatSources.Sources.push({ Name: name, Motive: [], Likelihood: LowMediumHighNumber.Medium });
    this.selectedSource = this.threatSources.Sources[this.threatSources.Sources.length-1];
  }

  public DeleteSource(src: IThreatSource) {
    const index = this.threatSources.Sources.indexOf(src);
    if (index >= 0) {
      this.threatSources.Sources.splice(index, 1);
      if (this.selectedSource == src) this.selectedSource = null;
    }
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
