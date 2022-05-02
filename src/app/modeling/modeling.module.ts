import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModelingRoutingModule } from './modeling-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ModelingComponent } from './modeling.component';
import { DiagramComponent } from './diagram/diagram.component';
import { StencilPaletteComponent } from './stencil-palette/stencil-palette.component';
import { StackComponent } from './stack/stack.component';
import { PropertiesComponent } from './properties/properties.component';
import { QuestionDialogComponent } from './stack/question-dialog/question-dialog.component';
import { ThreatTableComponent } from './threat-table/threat-table.component';
import { ThreatMappingComponent } from './threat-mapping/threat-mapping.component';
import { ConfigurationModule } from '../configuration/configuration.module';
import { IssueTableComponent } from './issue-table/issue-table.component';
import { DeviceAssetsComponent } from './device-assets/device-assets.component';
import { CharScopeComponent } from './analysis/char-scope/char-scope.component';
import { ObjImpactComponent } from './analysis/obj-impact/obj-impact.component';
import { ThreatSourcesComponent } from './analysis/threat-sources/threat-sources.component';
import { ThreatIdentificationComponent } from './analysis/threat-identification/threat-identification.component';
import { DeviceThreatComponent } from './analysis/device-threat/device-threat.component';
import { ContainerTreeComponent } from './container-tree/container-tree.component';
import { ChecklistComponent } from './checklist/checklist.component';
import { MitigationTableComponent } from './mitigation-table/mitigation-table.component';
import { MitigationMappingComponent } from './mitigation-mapping/mitigation-mapping.component';
import { MitigationProcessComponent } from './mitigation-process/mitigation-process.component';;


@NgModule({
  declarations: [ModelingComponent, DiagramComponent, StencilPaletteComponent, StackComponent, 
    PropertiesComponent, QuestionDialogComponent, ThreatTableComponent, ThreatMappingComponent, IssueTableComponent, DeviceAssetsComponent, CharScopeComponent, ObjImpactComponent, ThreatSourcesComponent, ThreatIdentificationComponent, DeviceThreatComponent, ContainerTreeComponent, ChecklistComponent, MitigationTableComponent, MitigationMappingComponent, MitigationProcessComponent],
  imports: [
    CommonModule,
    SharedModule,
    ModelingRoutingModule,
    ConfigurationModule
  ],
  exports: [
    MitigationMappingComponent,
    MitigationProcessComponent
  ]
})
export class ModelingModule { }
