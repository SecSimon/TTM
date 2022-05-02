import { Component, Input, OnInit, Optional } from '@angular/core';
import { ThreatCategoryGroup, ThreatMapping, ThreatOriginGroup, ThreatSeverities, ThreatSeverityUtil, ThreatStates, ThreatStateUtil } from '../../model/threat-model';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-threat-mapping',
  templateUrl: './threat-mapping.component.html',
  styleUrls: ['./threat-mapping.component.scss']
})
export class ThreatMappingComponent implements OnInit {
  private _threatRule: ThreatMapping;

  public get threatMapping(): ThreatMapping { return this._threatRule; }
  @Input() public set threatMapping(val: ThreatMapping) { 
    this._threatRule = val;
    this.devThreatGroups = null;
  }

  @Input() canEdit: boolean = true;

  constructor(@Optional() mapping: ThreatMapping, public theme: ThemeService, private dataService: DataService, private dialog: DialogService) {
    this.threatMapping = mapping;
  }

  ngOnInit(): void {
  }

  public GetThreatOriginGroups(): ThreatOriginGroup[] {
    return this.dataService.Config.GetThreatOriginGroups().filter(x => x.ThreatOrigins.length > 0);
  }
  public GetThreatCategoryGroups(): ThreatCategoryGroup[] {
    return this.dataService.Config.GetThreatCategoryGroups().filter(x => x.ThreatCategories.length > 0);
  }

  private devThreatGroups: any[];
  public GetDeviceThreatGroups() {
    if (this.devThreatGroups == null) {
      this.devThreatGroups = [];
      let feat = { name: 'general.Highlighted', DeviceThreats: [] };
      let all = { name: 'general.DeviceThreats', DeviceThreats: this.dataService.Project.GetDeviceThreats() };
      feat.DeviceThreats = all.DeviceThreats.filter(x => this.threatMapping.ThreatCategories.includes(x.ThreatCategory));
      if (feat.DeviceThreats.length > 0) this.devThreatGroups.push(feat);
      this.devThreatGroups.push(all);
    }

    return this.devThreatGroups;
  }

  public GetTargetsNames(): string {
    if (this.threatMapping.Targets) return this.threatMapping.Targets.map(x => x.Name).join(', ');
  }

  public AddThreatOrigin() {
    let origin = this.dataService.Config.CreateThreatOrigin(null);
    this.dialog.OpenAddThreatOriginDialog(origin).subscribe(res => {
      if (res) {
        this.threatMapping.ThreatOrigin = origin;
      }
      else {
        this.dataService.Config.DeleteThreatOrigin(origin);
      }
    });
  }

  public GetThreatStates() {
    return ThreatStateUtil.GetThreatStates();
  }

  public GetThreatStateName(ts: ThreatStates) {
    return ThreatStateUtil.ToString(ts);
  }

  public GetSeverityTypes() {
    return ThreatSeverityUtil.GetTypes();
  }

  public GetSeverityTypeName(sev: ThreatSeverities) {
    return ThreatSeverityUtil.ToString(sev);
  }
}
