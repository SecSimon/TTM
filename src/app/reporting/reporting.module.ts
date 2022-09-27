import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportingComponent } from './reporting.component';
import { ReportingRoutingModule } from './reporting-routing.module';
import { SharedModule } from '../shared/shared.module';



@NgModule({
  declarations: [ReportingComponent],
  imports: [
    CommonModule,
    SharedModule,
    ReportingRoutingModule
  ]
})
export class ReportingModule { }