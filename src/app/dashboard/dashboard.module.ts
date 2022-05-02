import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { ConfigurationModule } from '../configuration/configuration.module';
import { ModelingRoutingModule } from '../modeling/modeling-routing.module';
import { SharedModule } from '../shared/shared.module';
import { DashboardComponent } from './dashboard.component';


@NgModule({
  declarations: [DashboardComponent],
  imports: [
    CommonModule,
    SharedModule,
    DashboardRoutingModule,
    ModelingRoutingModule,
    ConfigurationModule
  ]
})
export class DashboardModule { }
