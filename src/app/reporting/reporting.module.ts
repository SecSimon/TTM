import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportingComponent } from './reporting.component';
import { ReportingRoutingModule } from './reporting-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ExportTemplateComponent } from './export-template/export-template.component';



@NgModule({
  declarations: [ReportingComponent, ExportTemplateComponent],
  imports: [
    CommonModule,
    SharedModule,
    ReportingRoutingModule
  ]
})
export class ReportingModule { }