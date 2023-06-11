import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ExportAttackScenarioPropertyUtil, ExportClasses, ExportClassUtil, ExportCommonPropertyUtil, ExportCountermeasurePropertyUtil, ExportFilters, ExportFilterUtil, ExportMitigationProcessPropertyUtil, ExportSystemThreatPropertyUtil, ExportTemplate, ExportTestCasePropertyUtil, ExportThreatSourcePropertyUtil, ExportTypes, ExportTypeUtil, IExportCell } from '../../model/export-template';
import { DataService } from '../../util/data.service';
import { ThemeService } from '../../util/theme.service';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { saveAs } from 'file-saver';
import writeXlsxFile from 'write-excel-file';

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
    this.dataRows = new MatTableDataSource(this.template.GetRowData(this.translate));
    setTimeout(() => {
      this.dataRows.sort = this.sort;
    });
  }

  public SaveCSV() {
    const data = [];
    data.push(this.template.Template.map(x => x.name));
    data.push(...this.dataRows.sortData(this.dataRows.filteredData, this.dataRows.sort));
    let res = '';
    let sep = ',';
    if (this.translate.currentLang == 'de') sep = ';';
    data.forEach(row => {
      res += row.map(x => '"' + x + '"').join(sep) + '\n';
    });

    const blob = new Blob([res]);
    saveAs(blob, this.dataService.Project.Name.replace('.ttmp', '.csv'), {type: "text/plain;charset=utf-8"});
  }

  public async SaveExcel() {
    const data = [];
    const header = [];
    this.template.Template.map(x => x.name).forEach(x => header.push({ value: x, fontWeight: 'bold' }));
    data.push(header);
    this.dataRows.sortData(this.dataRows.filteredData, this.dataRows.sort).forEach(row => {
      const d = [];
      row.forEach(x => d.push({ value: x }));
      data.push(d);
    });

    await writeXlsxFile([data], {
      fileName: this.dataService.Project.Name.replace('.ttmp', '.xlsx'),
      sheets: [this.template.Name]
    })
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

  public AddColumn(i) {
    this.template.Template.splice(i+1, 0, {name: '', value: null});
  }

  public DeleteColumn(col: IExportCell) {
    const index = this.template.Template.indexOf(col);
    if (index >= 0) {
      this.template.Template.splice(index, 1);
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
    if (ExportMitigationProcessPropertyUtil.GetKeys().includes(prop)) return ExportMitigationProcessPropertyUtil.ToString(prop);
    if (ExportSystemThreatPropertyUtil.GetKeys().includes(prop)) return ExportSystemThreatPropertyUtil.ToString(prop);
    if (ExportThreatSourcePropertyUtil.GetKeys().includes(prop)) return ExportThreatSourcePropertyUtil.ToString(prop);
    if (ExportTestCasePropertyUtil.GetKeys().includes(prop)) return ExportTestCasePropertyUtil.ToString(prop);
  }

  public GetExportTypeValues() {
    return ExportTypeUtil.GetKeys();
  }

  public GetExportTypeName(type: ExportTypes) {
    return ExportTypeUtil.ToString(type);
  }

  public GetExportFilterValues() {
    return ExportFilterUtil.GetKeys();
  }

  public GetExportFilterName(filter: ExportFilters) {
    return ExportFilterUtil.ToString(filter);
  }

  public ApplyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataRows.filter = filterValue.trim().toLowerCase();
  }

  public ToString(x) { 
    return x.toString();
  }
}
