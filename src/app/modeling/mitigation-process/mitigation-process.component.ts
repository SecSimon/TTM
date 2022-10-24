import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnInit, Optional, Output } from '@angular/core';
import { INote, ITask, MitigationMapping, MitigationProcess, MitigationProcessStates, MitigationProcessStateUtil, MitigationStates } from '../../model/mitigations';
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

  public isEdtingArray: boolean[][] = [[], []];

  @Input() canEdit: boolean = true;

  public get mitigationProcess(): MitigationProcess { return this._mitigationProcess; }
  @Input() public set mitigationProcess(val: MitigationProcess) { 
    this._mitigationProcess = val;
  }

  @Output() public mitigationMappingsChange = new EventEmitter();

  constructor(@Optional() mapping: MitigationProcess, public theme: ThemeService, public dataService: DataService, private dialog: DialogService) {
    this.mitigationProcess = mapping;
  }

  ngOnInit(): void {
  }

  public OnStateChange(val: MitigationProcessStates) {
    if (val == MitigationProcessStates.WorkInProgress) {
      if (this.mitigationProcess.Progress == 0) this.mitigationProcess.Progress = 5;
      this.mitigationProcess.MitigationMappings.forEach(x => {
        if ([MitigationStates.NotSet, MitigationStates.Mitigated].includes(x.MitigationState)) x.MitigationState = MitigationStates.MitigationStarted;
      });
    }
    else if (val == MitigationProcessStates.Completed) {
      this.mitigationProcess.Progress = 100;
      this.mitigationProcess.MitigationMappings.forEach(x => {
        if (x.MitigationState == MitigationStates.MitigationStarted) x.MitigationState = MitigationStates.Mitigated;
      });
    }
  }

  public OnProgressChange(val: number) {
    if (val == 100) {
      this.mitigationProcess.MitigationProcessState = MitigationProcessStates.Completed;
      this.mitigationProcess.MitigationMappings.forEach(x => {
        if (x.MitigationState == MitigationStates.MitigationStarted) x.MitigationState = MitigationStates.Mitigated;
      });
    }
    else if (val > 0) {
      this.mitigationProcess.MitigationProcessState = MitigationProcessStates.WorkInProgress;
      this.mitigationProcess.MitigationMappings.forEach(x => {
        if ([MitigationStates.NotSet, MitigationStates.Mitigated].includes(x.MitigationState)) x.MitigationState = MitigationStates.MitigationStarted;
      });
    }
  }

  public GetMitigationMappings() {
    return this.dataService.Project.GetMitigationMappings();
  }

  public GetMitigationMappingsName(val: MitigationMapping[]) {
    return val?.map(x => x.Name).join(', ');
  }

  public formatLabel(value: number) {
    return value.toFixed(0) + '%';
  }

  public OnDeleteItem(item: any, selectedArray: any[]) {
    const index = selectedArray.indexOf(item);
    if (index >= 0) selectedArray.splice(index, 1);
  }

  public OnRenameItem(event, items: any[], arr: number, index: number, key: string) {
    if (event.key === 'Enter' || event.type === 'focusout') {
      items[index][key] = event.target['value'];
      this.isEdtingArray[arr][index] = false;
    }
  }

  public OnTaskKeyDown(event: KeyboardEvent) {
    if (event.key == 'Enter') {
      this.mitigationProcess.Tasks.push({ Task: event.target['value'], IsDone: false });
      event.target['value'] = '';
    }
  }

  public OnNoteKeyDown(event: KeyboardEvent) {
    if (event.key == 'Enter') {
      this.mitigationProcess.Notes.push({ Date: Date.now().toString(), Author: this.dataService.UserDisplayName, Note: event.target['value'] });
      event.target['value'] = '';
    }
  }

  public drop(event: CdkDragDrop<string[]>, selectedArray) {
    moveItemInArray(selectedArray, event.previousIndex, event.currentIndex);
  }

  public GetMitigationProcessStates() {
    return MitigationProcessStateUtil.GetMitigationStates();
  }

  public GetMitigationProcessStateName(ms: MitigationProcessStates) {
    return MitigationProcessStateUtil.ToString(ms);
  }
}
