import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConfigurationRoutingModule } from './configuration-routing.module';
import { SharedModule } from '../shared/shared.module';

import { ConfigurationComponent } from './configuration.component';
import { StencilsComponent } from './stencils/stencils.component';
import { ThreatCategoriesComponent } from './threat-categories/threat-categories.component';
import { ComponentsComponent } from './components/components.component';
import { ThreatLibraryComponent } from './threat-library/threat-library.component';
import { RulesComponent } from './rules/rules.component';
import { ThreatRuleComponent } from './threat-rule/threat-rule.component';
import { AttackVectorComponent } from './attack-vector/attack-vector.component';
import { ThreatQuestionComponent } from './threat-question/threat-question.component';
import { AssetsComponent } from './assets/assets.component';
import { MyDataComponent } from './mydata/mydata.component';
import { ThreatCategoryComponent } from './threat-category/threat-category.component';
import { ControlsComponent } from './controls/controls.component';
import { ControlComponent } from './control/control.component';
import { ChecklistsComponent } from './checklists/checklists.component';
import { ThreatSourcesComponent } from './threat-sources/threat-sources.component';
import { ThreatActorComponent } from './threat-actor/threat-actor.component';
import { WarningDialogComponent } from './warning-dialog/warning-dialog.component';

@NgModule({
  declarations: [ConfigurationComponent, StencilsComponent, ThreatCategoriesComponent, ComponentsComponent, ThreatLibraryComponent, RulesComponent, ThreatRuleComponent, AttackVectorComponent, ThreatQuestionComponent, AssetsComponent, MyDataComponent, ThreatCategoryComponent, ControlsComponent, ControlComponent, ChecklistsComponent, ThreatSourcesComponent, ThreatActorComponent, WarningDialogComponent],
  imports: [
    CommonModule,
    SharedModule,
    ConfigurationRoutingModule
  ],
  exports: [
    ThreatActorComponent,
    AttackVectorComponent,
    ThreatQuestionComponent,
    ThreatRuleComponent,
    AssetsComponent,
    ThreatCategoryComponent,
    MyDataComponent,
    ControlComponent
  ]
})
export class ConfigurationModule { }
