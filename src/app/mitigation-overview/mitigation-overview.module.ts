import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MitigationOverviewRoutingModule } from './mitigation-overview-routing.module';
import { SharedModule } from '../shared/shared.module';
import { MitigationOverviewComponent } from './mitigation-overview.component';
import { ModelingModule } from '../modeling/modeling.module';


@NgModule({
  declarations: [MitigationOverviewComponent],
  imports: [
    CommonModule,
    SharedModule,
    MitigationOverviewRoutingModule,
    ModelingModule,
  ]
})
export class MitigationOverviewModule { }