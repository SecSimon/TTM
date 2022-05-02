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
import { ThreatOriginComponent } from './threat-origin/threat-origin.component';
import { ThreatQuestionComponent } from './threat-question/threat-question.component';
import { AssetsComponent } from './assets/assets.component';
import { MyDataComponent } from './mydata/mydata.component';
import { ThreatCategoryComponent } from './threat-category/threat-category.component';
import { MitigationsComponent } from './mitigations/mitigations.component';
import { MitigationComponent } from './mitigation/mitigation.component';
import { ChecklistsComponent } from './checklists/checklists.component';

@NgModule({
  declarations: [ConfigurationComponent, StencilsComponent, ThreatCategoriesComponent, ComponentsComponent, ThreatLibraryComponent, RulesComponent, ThreatRuleComponent, ThreatOriginComponent, ThreatQuestionComponent, AssetsComponent, MyDataComponent, ThreatCategoryComponent, MitigationsComponent, MitigationComponent, ChecklistsComponent],
  imports: [
    CommonModule,
    SharedModule,
    ConfigurationRoutingModule
  ],
  exports: [
    ThreatOriginComponent,
    ThreatRuleComponent,
    AssetsComponent,
    ThreatCategoryComponent,
    MyDataComponent,
    MitigationComponent
  ]
})
export class ConfigurationModule { }
