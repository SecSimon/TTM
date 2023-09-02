import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { LowMediumHighNumberUtil, LowMediumHighNumber } from '../../../model/assets';
import { ThreatActor, ThreatSources } from '../../../model/threat-source';
import { DataService } from '../../../util/data.service';
import { ThemeService } from '../../../util/theme.service';

@Component({
  selector: 'app-threat-sources',
  templateUrl: './threat-sources.component.html',
  styleUrls: ['./threat-sources.component.scss']
})
export class ThreatSourcesComponent implements OnInit {

  @Input() public threatSources: ThreatSources;

  @ViewChild('nameBox') public nameBox: ElementRef;

  public selectedSource: ThreatActor;

  public isEdtingArray: boolean[] = [];

  constructor(public theme: ThemeService, public dataService: DataService) { }

  ngOnInit(): void {
  }

  public AddSource() {
    let actor = this.dataService.Project.CreateThreatActor();
    this.threatSources.AddThreatActor(actor);
    this.selectedSource = actor;
    setTimeout(() => {
      if (this.nameBox) {
        (this.nameBox.nativeElement as HTMLInputElement).select();
      }
    }, 250);
    return actor;
  }

  public AddExistingSource(src: ThreatActor) {
    const actor = this.AddSource();
    const num = actor.Number;
    actor.CopyFrom(src.Data);
    actor.Number = num;
    actor.Data['origID'] = src.ID;
  }

  public GetPossibleThreatSources() {
    return this.dataService.Config.GetThreatActors().filter(x => !this.threatSources.Sources.map(x => x.Data['origID']).includes(x.ID));
  }

  public DeleteSource(ta: ThreatActor) {
    if (this.selectedSource == ta) this.selectedSource = null;
    this.dataService.Project.DeleteThreatActor(ta);
  }

  public ResetNumbers() {
    const arr = this.threatSources.Sources;
    for (let i = 0; i < arr.length; i++) {
      arr[i].Number = (i+1).toString();
    }
  }

  public drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.threatSources.Data['sourceIDs'], event.previousIndex, event.currentIndex);
  }

  public GetLMHValues() {
    return LowMediumHighNumberUtil.GetKeys();
  }

  public GetLMHName(type: LowMediumHighNumber) {
    return LowMediumHighNumberUtil.ToString(type);
  }
}
