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
import { AttackScenarioComponent } from './attack-scenario/attack-scenario.component';
import { ConfigurationModule } from '../configuration/configuration.module';
import { IssueTableComponent } from './issue-table/issue-table.component';
import { DeviceAssetsComponent } from './device-assets/device-assets.component';
import { CharScopeComponent } from './analysis/char-scope/char-scope.component';
import { ObjImpactComponent } from './analysis/obj-impact/obj-impact.component';
import { ThreatSourcesComponent } from './analysis/threat-sources/threat-sources.component';
import { ThreatIdentificationComponent } from './analysis/threat-identification/threat-identification.component';
import { SystemThreatComponent } from './analysis/system-threat/system-threat.component';
import { ContainerTreeComponent } from './container-tree/container-tree.component';
import { ChecklistComponent } from './checklist/checklist.component';
import { CountermeasureTableComponent } from './countermeasure-table/countermeasure-table.component';
import { CountermeasureComponent } from './countermeasure/countermeasure.component';
import { MitigationProcessComponent } from './mitigation-process/mitigation-process.component';
import { SuggestedThreatsDialogComponent } from './diagram/suggested-threats-dialog/suggested-threats-dialog.component';
import { TestingComponent } from './testing/testing.component';
import { TestCaseComponent } from './test-case/test-case.component';
import { TestCaseTableComponent } from './test-case-table/test-case-table.component';;


@NgModule({
  declarations: [ModelingComponent, DiagramComponent, StencilPaletteComponent, StackComponent, PropertiesComponent, QuestionDialogComponent, 
    ThreatTableComponent, AttackScenarioComponent, IssueTableComponent, DeviceAssetsComponent, CharScopeComponent, ObjImpactComponent, 
    ThreatSourcesComponent, ThreatIdentificationComponent, SystemThreatComponent, ContainerTreeComponent, ChecklistComponent, CountermeasureTableComponent, 
    CountermeasureComponent, MitigationProcessComponent, SuggestedThreatsDialogComponent, TestingComponent, TestCaseComponent, TestCaseTableComponent],
  imports: [
    CommonModule,
    SharedModule,
    ModelingRoutingModule,
    ConfigurationModule
  ],
  exports: [
    CountermeasureComponent,
    MitigationProcessComponent
  ]
})
export class ModelingModule { }
