import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Optional, Output, ViewChild } from '@angular/core';
import { ViewElementBase } from '../../model/database';
import { ControlGroup, Countermeasure, MitigationStates, MitigationStateUtil } from '../../model/mitigations';
import { DataService } from '../../util/data.service';
import { DialogService, MyBoolean } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-countermeasure',
  templateUrl: './countermeasure.component.html',
  styleUrls: ['./countermeasure.component.scss']
})
export class CountermeasureComponent implements OnInit {
  private _countermeasure: Countermeasure;

  public get countermeasure(): Countermeasure { return this._countermeasure; }
  @Input() public set countermeasure(val: Countermeasure) { 
    this._countermeasure = val;
  }

  @Input() canEdit: boolean = true;
  @Input() public isManualEntry: boolean = false;
  @Input() public elements: ViewElementBase[] = [];

  @Output() public mitigationProcessChange = new EventEmitter();

  @ViewChild('nameBox') public nameBox: ElementRef;

  constructor(@Optional() mapping: Countermeasure, @Optional() isNew: MyBoolean, @Optional() elements: Array<ViewElementBase>, @Optional() onChange: EventEmitter<Countermeasure>, 
  public theme: ThemeService, public dataService: DataService, private dialog: DialogService) {
    this.countermeasure = mapping;
    if (isNew) this.isManualEntry = isNew.Value;
    if (elements) this.elements = elements;
    if (onChange) {
      onChange.subscribe(x => this.countermeasure = x);
    }
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

  public GetControlGroups(): ControlGroup[] {
    return this.dataService.Config.GetControlGroups().filter(x => x.Controls.length > 0);
  }

  public GetTargetsNames(): string {
    if (this.countermeasure.Targets) return this.countermeasure.Targets.map(x => x.Name).join(', ');
  }

  public AddControl() {
    let mit = this.dataService.Config.CreateControl(this.dataService.Config.ControlLibrary);
    this.dialog.OpenAddControlDialog(mit).subscribe(res => {
      if (res) {
        this.countermeasure.Control = mit;
      }
      else {
        this.dataService.Config.DeleteControl(mit);
      }
    });
  }

  public AddMitigationProcess() {
    let proc = this.dataService.Project.CreateMitigationProcess();
    this.countermeasure.MitigationProcess = proc;
    this.dialog.OpenMitigationProcessDialog(proc, true).subscribe(res => {
      if (!res) {
        this.dataService.Project.DeleteMitigationProcess(proc);
      }
    });
  }

  public EditMitigationProcess() {
    this.dialog.OpenMitigationProcessDialog(this.countermeasure.MitigationProcess, false).subscribe(res => {
    });
  }

  public GetMitigationProcesses() {
    return this.dataService.Project.GetMitigationProcesses();
  }

  public GetMitigationStates() {
    return MitigationStateUtil.GetMitigationStates();
  }

  public GetMitigationStateName(ms: MitigationStates) {
    return MitigationStateUtil.ToString(ms);
  }
}
