import { Component, EventEmitter, Input, OnInit, Optional, Output } from '@angular/core';
import { ViewElementBase } from '../../model/database';
import { MitigationGroup, MitigationMapping, MitigationStates, MitigationStateUtil } from '../../model/mitigations';
import { DataService } from '../../util/data.service';
import { DialogService, MyBoolean } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-mitigation-mapping',
  templateUrl: './mitigation-mapping.component.html',
  styleUrls: ['./mitigation-mapping.component.scss']
})
export class MitigationMappingComponent implements OnInit {
  private _mitigationMapping: MitigationMapping;

  public get mitigationMapping(): MitigationMapping { return this._mitigationMapping; }
  @Input() public set mitigationMapping(val: MitigationMapping) { 
    this._mitigationMapping = val;
  }

  @Input() canEdit: boolean = true;
  @Input() public isManualEntry: boolean = false;
  @Input() public elements: ViewElementBase[] = [];

  @Output() public mitigationProcessChange = new EventEmitter();

  constructor(@Optional() mapping: MitigationMapping, @Optional() isNew: MyBoolean, @Optional() elements: Array<ViewElementBase>, public theme: ThemeService, private dataService: DataService, private dialog: DialogService) {
    this.mitigationMapping = mapping;
    if (isNew) this.isManualEntry = isNew.Value;
    if (elements) this.elements = elements;
  }

  ngOnInit(): void {
  }

  public GetMitigationGroups(): MitigationGroup[] {
    return this.dataService.Config.GetMitigationGroups().filter(x => x.Mitigations.length > 0);
  }

  public GetTargetsNames(): string {
    if (this.mitigationMapping.Targets) return this.mitigationMapping.Targets.map(x => x.Name).join(', ');
  }

  public AddMitigation() {
    let mit = this.dataService.Config.CreateMitigation(this.dataService.Config.MitigationLibrary);
    this.dialog.OpenAddMitigationDialog(mit).subscribe(res => {
      if (res) {
        this.mitigationMapping.Mitigation = mit;
      }
      else {
        this.dataService.Config.DeleteMitigation(mit);
      }
    });
  }

  public AddMitigationProcess() {
    let proc = this.dataService.Project.CreateMitigationProcess();
    this.mitigationMapping.MitigationProcess = proc;
    this.dialog.OpenMitigationProcessDialog(proc, true).subscribe(res => {
      if (!res) {
        this.dataService.Project.DeleteMitigationProcess(proc);
      }
    });
  }

  public EditMitigationProcess() {
    this.dialog.OpenMitigationProcessDialog(this.mitigationMapping.MitigationProcess, false).subscribe(res => {
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
