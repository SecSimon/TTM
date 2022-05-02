import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ModelingComponent } from './modeling.component';

const routes: Routes = [
  {
    path: 'modeling',
    component: ModelingComponent
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ModelingRoutingModule { }
