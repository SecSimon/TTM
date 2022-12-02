import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ExportAttackScenarioPropertyUtil, ExportClasses, ExportClassUtil, ExportCommonPropertyUtil, ExportCountermeasurePropertyUtil, ExportSystemThreatPropertyUtil, ExportTemplate, ExportThreatSourcePropertyUtil, ExportTypes, ExportTypeUtil } from '../../model/export-template';
import { DataService } from '../../util/data.service';
import { ThemeService } from '../../util/theme.service';

import { saveAs } from 'file-saver';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-export-template',
  templateUrl: './export-template.component.html',
  styleUrls: ['./export-template.component.scss']
})
export class ExportTemplateComponent implements OnInit {
  private _template: ExportTemplate;

  public get template(): ExportTemplate { return this._template; }
  @Input()
  public set template(val: ExportTemplate) {
    this._template = val;
    if (val) {
      if (!val.Template || val.Template.length <= 1) val.Template = [{name: '', value: null}, {name: '', value: null}];
    }

    this.dataRows = null;
  }

  @Input()
  public canEdit: boolean = true;

  public get canGenerate(): boolean { return this.template.Template.some(x => x.value != null); }
  public get canDownload(): boolean { return this.dataRows != null; }

  public get displayedColumns() { return [...Array(this.template.Template.filter(x => x.value).length).keys()].map(x => x.toString()); } // get array of number from 0 to N-1
  public get displayedTemplate() { return this.template.Template.filter(x => x.value); }
  public dataRows: MatTableDataSource<any> = null; 

  @ViewChild(MatSort) sort: MatSort;

  constructor(public theme: ThemeService, public dataService: DataService, private translate: TranslateService) { }

  ngOnInit(): void {
  }

  public GeneratePreview() {
    const rows = [];
    let src: any[];
    if (this.template.ExportType == ExportTypes.AttackScenarios) src = this.dataService.Project.GetAttackScenarios();
    else if (this.template.ExportType == ExportTypes.Countermeasure) src = this.dataService.Project.GetCountermeasures();
    else if (this.template.ExportType == ExportTypes.SystemThreats) src = this.dataService.Project.GetSystemThreats();
    else if (this.template.ExportType == ExportTypes.ThreatSources) src = this.dataService.Project.GetThreatActors();
    src.forEach(entry => {
      const row = [];
      this.template.Template.forEach(col => {
        if (col.value) {
          let val = ExportClassUtil.GetValue(col.value, entry, this.translate); 
          if (val && val?.length > 0) val = this.translate.instant(val);
          row.push(val);
        }
      });
      rows.push(row);
    });

    this.dataRows = new MatTableDataSource(rows);
    setTimeout(() => {
      this.dataRows.sort = this.sort;
    }, 100);
  }

  public SaveCSV() {
    const data = [];
    data.push(this.template.Template.map(x => x.name));
    data.push(...this.dataRows.sortData(this.dataRows.filteredData, this.dataRows.sort));
    let res = '';
    data.forEach(row => {
      res += row.map(x => '"' + x + '"').join(',') + '\n';
    });

    const blob = new Blob([res]);
    saveAs(blob, this.dataService.Project.Name.replace('.ttmp', '.csv'));
  }

  public OnCellChanged(event, i) {
    const newVal = event['target']['value'];
    this.template.Template[i].value = newVal == '' ? null : newVal;
    if (this.template.Template[i].value) this.template.Template[i].name = this.translate.instant(this.GetExportPropertyName(this.template.Template[i].value.split('.')[1]));
    if (i == this.template.Template.length - 1 && newVal != '') { this.template.Template.push({name: '', value: null}); }
    if (newVal == '') {
      let index = this.template.Template.length;
      while (index > 0 && this.template.Template[index-1].value == null) index -= 1;
      this.template.Template.splice(index+1);
    }
  }

  public GetAvailableClasses() {
    return ExportClassUtil.GetKeys(this.template.ExportType);
  }

  public GetExportClassName(cl: ExportClasses) {
    return ExportClassUtil.ToString(cl);
  }

  public GetExportProperties(cl: ExportClasses) {
    return ExportClassUtil.GetProperties(cl);
  }

  public GetExportPropertyName(prop) {
    if (ExportCommonPropertyUtil.GetKeys().includes(prop)) return ExportCommonPropertyUtil.ToString(prop);
    if (ExportAttackScenarioPropertyUtil.GetKeys().includes(prop)) return ExportAttackScenarioPropertyUtil.ToString(prop);
    if (ExportCountermeasurePropertyUtil.GetKeys().includes(prop)) return ExportCountermeasurePropertyUtil.ToString(prop);
    if (ExportSystemThreatPropertyUtil.GetKeys().includes(prop)) return ExportSystemThreatPropertyUtil.ToString(prop);
    if (ExportThreatSourcePropertyUtil.GetKeys().includes(prop)) return ExportThreatSourcePropertyUtil.ToString(prop);
  }

  public GetExportTypeValues() {
    return ExportTypeUtil.GetKeys();
  }

  public GetExportTypeName(type: ExportTypes) {
    return ExportTypeUtil.ToString(type);
  }

  public ApplyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataRows.filter = filterValue.trim().toLowerCase();
  }

  public ToString(x) { 
    return x.toString();
  }
}
