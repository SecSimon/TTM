import { Component, EventEmitter, Input, OnInit, Optional, Output } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Countermeasure, MitigationProcess, MitigationProcessStates, MitigationProcessStateUtil, MitigationStates } from '../../model/mitigations';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-mitigation-process',
  templateUrl: './mitigation-process.component.html',
  styleUrls: ['./mitigation-process.component.scss']
})
export class MitigationProcessComponent implements OnInit {
  private _mitigationProcess: MitigationProcess;

  public isEdtingArray: boolean[][] = [[], []];

  @Input() canEdit: boolean = true;

  public get mitigationProcess(): MitigationProcess { return this._mitigationProcess; }
  @Input() public set mitigationProcess(val: MitigationProcess) { 
    this._mitigationProcess = val;
  }

  @Output() public countermeasuresChange = new EventEmitter();

  constructor(@Optional() mapping: MitigationProcess, public theme: ThemeService, public dataService: DataService, private dialog: DialogService) {
    this.mitigationProcess = mapping;
  }

  ngOnInit(): void {
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
    return this.dataService.Project.GetCountermeasures();
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

  public NumberAlreadyExists() {
    return this.dataService.Project.GetMitigationProcesses().some(x => x.Number == this.mitigationProcess.Number && x.ID != this.mitigationProcess.ID);
  }
}
