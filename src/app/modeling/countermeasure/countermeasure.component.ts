import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Optional, Output, ViewChild } from '@angular/core';
import { ViewElementBase } from '../../model/database';
import { ControlGroup, Countermeasure, MitigationProcess, MitigationStates, MitigationStateUtil } from '../../model/mitigations';
import { DataService } from '../../util/data.service';
import { DialogService, MyBoolean } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';
import { TestCase } from '../../model/test-case';

@Component({
  selector: 'app-countermeasure',
  templateUrl: './countermeasure.component.html',
  styleUrls: ['./countermeasure.component.scss']
})
export class CountermeasureComponent implements OnInit {
  private _countermeasure: Countermeasure;
  private searchCounter = 0;
  private controlGroups: any[];
  private mitigationProcesses: MitigationProcess[];

  public get countermeasure(): Countermeasure { return this._countermeasure; }
  @Input() public set countermeasure(val: Countermeasure) {
    this._countermeasure = val;
    this.controlGroups = this.mitigationProcesses = null;
  }

  @Input() canEdit: boolean = true;
  @Input() public isManualEntry: boolean = false;
  @Input() public elements: ViewElementBase[] = [];

  @Output() public mitigationProcessChange = new EventEmitter();

  @ViewChild('nameBox') public nameBox: ElementRef;
  @ViewChild('searchTCBox', { static: false }) public searchTCBox: any;
  public searchTCString: string = '';
  public selectedTestCase: TestCase;

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

  public GetControlGroups(): any[] {
    if (this.controlGroups == null) {
      this.controlGroups = [];
      this.dataService.Config.GetControlGroups().forEach(group => {
        if (group.Controls.length > 0) {
          this.controlGroups.push({ name: group.Name, Controls: group.Controls });
        }
      });
    }

    return this.controlGroups;
  }

  public OnSearchControls(event: KeyboardEvent) {
    this.searchCounter++;
    setTimeout(() => {
      this.searchCounter--;
      if (this.searchCounter == 0) {
        this.controlGroups = null; // recreate groups
        this.GetControlGroups();
        const search = (event.target as HTMLInputElement).value.toLowerCase();
        const curr = this.countermeasure.Control;
        this.controlGroups.forEach(group => {
          group.Controls = group.Controls.filter(x => x == curr || x.Name.toLowerCase().includes(search));
        });
        this.controlGroups = this.controlGroups.filter(x => x.Controls.length > 0);
      }
    }, 250);
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
    setTimeout(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'F2' }));
    }, 500);
  }

  public EditMitigationProcess() {
    this.dialog.OpenMitigationProcessDialog(this.countermeasure.MitigationProcess, false).subscribe(res => {
    });
  }

  public GetTestCases() {
    return this.dataService.Project.GetTesting().TestCases.filter(x => !this.countermeasure.GetTestCases().includes(x));
  }

  public GetFilteredTestCases() {
    return this.GetTestCases().filter(x => x.Name.toLowerCase().includes(this.searchTCString.toLowerCase()));
  }

  public OnLinkTestCase(tc: TestCase) {
    tc.AddLinkedCountermeasure(this.countermeasure);
    this.selectedTestCase = tc;
  }

  public OnUnlinkTestCase(tc: TestCase) {
    tc.RemoveLinkedCountermeasure(this.countermeasure.ID);
    if (this.selectedTestCase == tc) this.selectedTestCase = null;
  }

  public OnSearchTCBoxClick() {
    this.searchTCBox?._elementRef?.nativeElement?.focus();
  }

  public GetMitigationProcesses() {
    if (this.mitigationProcesses == null) {
      this.mitigationProcesses = this.dataService.Project.GetMitigationProcesses();
    }

    return this.mitigationProcesses;
  }

  public OnSearchMitigationProcess(event: KeyboardEvent) {
    this.searchCounter++;
    setTimeout(() => {
      this.searchCounter--;
      if (this.searchCounter == 0) {
        this.mitigationProcesses = null; // recreate groups
        this.GetMitigationProcesses();
        const search = (event.target as HTMLInputElement).value.toLowerCase();
        const curr = this.countermeasure.MitigationProcess;
        this.mitigationProcesses = this.mitigationProcesses.filter(x => curr == x || x.Name.toLowerCase().includes(search));
      }
    }, 250);
  }

  public GetMitigationStates() {
    return MitigationStateUtil.GetMitigationStates();
  }

  public GetMitigationStateName(ms: MitigationStates) {
    return MitigationStateUtil.ToString(ms);
  }
}
