import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Optional, Output, ViewChild } from '@angular/core';
import { Countermeasure, MitigationProcess, MitigationProcessStates, MitigationProcessStateUtil, MitigationStates } from '../../model/mitigations';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-mitigation-process',
  templateUrl: './mitigation-process.component.html',
  styleUrls: ['./mitigation-process.component.scss']
})
export class MitigationProcessComponent implements OnInit {
  private _mitigationProcess: MitigationProcess;
  private searchCounter: number = 0;
  private countermeasures: Countermeasure[];

  public isEdtingArray: boolean[][] = [[], []];

  @Input() canEdit: boolean = true;

  public get mitigationProcess(): MitigationProcess { return this._mitigationProcess; }
  @Input() public set mitigationProcess(val: MitigationProcess) { 
    this._mitigationProcess = val;
    this.countermeasures = null;
  }

  @Output() public countermeasuresChange = new EventEmitter();

  @ViewChild('nameBox') public nameBox: ElementRef;

  constructor(@Optional() mapping: MitigationProcess, public theme: ThemeService, public dataService: DataService, private dialog: DialogService) {
    this.mitigationProcess = mapping;
  }

  ngOnInit(): void {
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (event.key == 'F2') {
      event.preventDefault();
      if (this.nameBox) {
        (this.nameBox.nativeElement as HTMLInputElement).select();
      }
    }
  }

  public AdoptFromMeasures() {
    this.mitigationProcess.Countermeasures.forEach(cm => {
      if (!this.mitigationProcess.Tasks.some(x => x.Note == cm.Name)) {
        this.mitigationProcess.Tasks.push({ Note: cm.Name + ' (CM' + cm.Number.toString() + ')', IsChecked: false, Date: Date.now().toString(), Author: this.dataService.UserDisplayName, HasCheckbox: true, ShowTimestamp: false });
      }
    });
  }

  public OnStateChange(val: MitigationProcessStates) {
    if (val == MitigationProcessStates.WorkInProgress) {
      if (this.mitigationProcess.Progress == 0) this.mitigationProcess.Progress = 5;
      this.mitigationProcess.Countermeasures.forEach(x => {
        if ([MitigationStates.NotSet, MitigationStates.Implemented].includes(x.MitigationState)) x.MitigationState = MitigationStates.MitigationStarted;
      });
    }
    else if (val == MitigationProcessStates.Completed) {
      this.mitigationProcess.Progress = 100;
      this.mitigationProcess.Countermeasures.forEach(x => {
        if (x.MitigationState == MitigationStates.MitigationStarted) x.MitigationState = MitigationStates.Implemented;
      });
    }
  }

  public OnProgressChange(val: number) {
    if (val == 100) {
      this.mitigationProcess.MitigationProcessState = MitigationProcessStates.Completed;
      this.mitigationProcess.Countermeasures.forEach(x => {
        if (x.MitigationState == MitigationStates.MitigationStarted) x.MitigationState = MitigationStates.Implemented;
      });
    }
    else if (val > 0) {
      this.mitigationProcess.MitigationProcessState = MitigationProcessStates.WorkInProgress;
      this.mitigationProcess.Countermeasures.forEach(x => {
        if ([MitigationStates.NotSet, MitigationStates.Implemented].includes(x.MitigationState)) x.MitigationState = MitigationStates.MitigationStarted;
      });
    }
  }

  public GetCountermeasures() {
    if (this.countermeasures == null) this.countermeasures = this.dataService.Project.GetCountermeasures();

    return this.countermeasures;
  }

  public OnSearchCountermeasure(event: KeyboardEvent) {
    this.searchCounter++;
    setTimeout(() => {
      this.searchCounter--;
      if (this.searchCounter == 0) {
        this.countermeasures = null;
        this.GetCountermeasures();
        const search = (event.target as HTMLInputElement).value.toLowerCase();
        const curr = this.mitigationProcess.Countermeasures;
        this.countermeasures = this.countermeasures.filter(x => curr.includes(x) || x.Name.toLowerCase().includes(search));
      }
    }, 250);
  }

  public GetCountermeasuresName(val: Countermeasure[]) {
    return val?.map(x => x.Name).join(', ');
  }

  public formatLabel(value: number) {
    return value.toFixed(0) + '%';
  }

  public GetMitigationProcessStates() {
    return MitigationProcessStateUtil.GetMitigationStates();
  }

  public GetMitigationProcessStateName(ms: MitigationProcessStates) {
    return MitigationProcessStateUtil.ToString(ms);
  }
}
