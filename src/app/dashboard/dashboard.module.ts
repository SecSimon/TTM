import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { ConfigurationModule } from '../configuration/configuration.module';
import { ModelingRoutingModule } from '../modeling/modeling-routing.module';
import { SharedModule } from '../shared/shared.module';
import { DashboardComponent } from './dashboard.component';
import { ResultsChartComponent } from './results-chart/results-chart.component';
import { ResultsAnalysisComponent } from './results-analysis/results-analysis.component';
import { TagChartsComponent } from './tag-charts/tag-charts.component';


@NgModule({
  declarations: [DashboardComponent, ResultsChartComponent, ResultsAnalysisComponent, TagChartsComponent],
  imports: [
    CommonModule,
    SharedModule,
    DashboardRoutingModule,
    ModelingRoutingModule,
    ConfigurationModule
  ]
})
export class DashboardModule { }
