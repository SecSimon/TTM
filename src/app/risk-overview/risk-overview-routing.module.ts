import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RiskOverviewComponent } from './risk-overview.component';
import { CommonModule } from '@angular/common';

const routes: Routes = [
  {
    path: 'risk',
    component: RiskOverviewComponent
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RiskOverviewRoutingModule { }