import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RiskOverviewRoutingModule } from './risk-overview-routing.module';
import { RiskOverviewComponent } from './risk-overview.component';
import { SharedModule } from '../shared/shared.module';
import { ModelingModule } from '../modeling/modeling.module';


@NgModule({
  declarations: [RiskOverviewComponent],
  imports: [
    CommonModule,
    SharedModule,
    RiskOverviewRoutingModule,
    ModelingModule
  ]
})
export class RiskOverviewModule { }