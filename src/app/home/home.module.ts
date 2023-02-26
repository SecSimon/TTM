import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';

import { HomeComponent } from './home.component';
import { SharedModule } from '../shared/shared.module';
import { WelcomeDialogComponent } from './Dialogs/welcome-dialog/welcome-dialog.component';
import { LanguageDialogComponent } from './Dialogs/language-dialog/language-dialog.component';

@NgModule({
  declarations: [HomeComponent, WelcomeDialogComponent, LanguageDialogComponent],
  imports: [CommonModule, SharedModule, HomeRoutingModule]
})
export class HomeModule {}