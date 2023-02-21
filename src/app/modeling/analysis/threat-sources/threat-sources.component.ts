import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
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

  public selectedSource: ThreatActor;

  public isEdtingArray: boolean[] = [];

  constructor(public theme: ThemeService, public dataService: DataService) { }

  ngOnInit(): void {
  }

  public AddSource() {
    let actor = this.dataService.Project.CreateThreatActor();
    this.threatSources.AddThreatActor(actor);
    this.selectedSource = actor;
    return actor;
  }

  public AddExistingSource(src: ThreatActor) {
    const actor = this.AddSource();
    actor.CopyFrom(src.Data);
    actor.Data['origID'] = src.ID;
  }

  public GetPossibleThreatSources() {
    return this.dataService.Config.GetThreatActors().filter(x => !this.threatSources.Sources.map(x => x.Data['origID']).includes(x.ID));
  }

  public DeleteSource(ta: ThreatActor) {
    if (this.selectedSource == ta) this.selectedSource = null;
    this.dataService.Project.DeleteThreatActor(ta);
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

  public NumberAlreadyExists() {
    return this.dataService.Project.GetThreatActors().some(x => x.Number == this.selectedSource.Number && x.ID != this.selectedSource.ID);
  }
}
