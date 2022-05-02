import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MitigationOverviewComponent } from './mitigation-overview.component';

const routes: Routes = [
  {
    path: 'mitigation',
    component: MitigationOverviewComponent
  }
];
@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MitigationOverviewRoutingModule { }


