import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { LowMediumHighNumberUtil, LowMediumHighNumber } from '../../model/assets';
import { ThreatActor } from '../../model/threat-source';
import { DataService } from '../../util/data.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-threat-actor',
  templateUrl: './threat-actor.component.html',
  styleUrls: ['./threat-actor.component.scss']
})
export class ThreatActorComponent implements OnInit {
  public isEdtingArray: boolean[] = [];

  @Input() public threatActor: ThreatActor;

  constructor(public theme: ThemeService, public dataService: DataService) { }

  ngOnInit(): void {
  }

  public GetLMHValues() {
    return LowMediumHighNumberUtil.GetKeys();
  }

  public GetLMHName(type: LowMediumHighNumber) {
    return LowMediumHighNumberUtil.ToString(type);
  }
}
