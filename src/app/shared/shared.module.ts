import { LOCALE_ID, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ClipboardModule } from '@angular/cdk/clipboard';
import { CdkTableModule } from '@angular/cdk/table';
import { CdkTreeModule } from '@angular/cdk/tree';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTreeModule } from '@angular/material/tree';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSliderModule } from '@angular/material/slider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AngularSplitModule } from 'angular-split';
import { AngularResizeEventModule } from 'angular-resize-event';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { MAT_COLOR_FORMATS, NgxMatColorPickerModule, NGX_MAT_COLOR_FORMATS } from '@angular-material-components/color-picker';

import { SideNavComponent } from './components/side-nav/side-nav.component';
import { StatusBarComponent } from './components/status-bar/status-bar.component';
import { SaveDialogComponent } from './components/save-dialog/save-dialog.component';
import { PasswordDialogComponent } from './components/password-dialog/password-dialog.component';
import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';
import { MessagesDialogComponent } from './components/messages-dialog/messages-dialog.component';
import { TwoOptionsDialogComponent } from './components/two-options-dialog/two-options-dialog.component';
import { CweEntryComponent } from './components/cwe-entry/cwe-entry.component';
import { CapecEntryComponent } from './components/capec-entry/capec-entry.component';
import { NavTreeComponent } from './components/nav-tree/nav-tree.component';
import { CvssEntryComponent } from './components/cvss-entry/cvss-entry.component';
import { ProgressTrackerComponent } from './components/progress-tracker/progress-tracker.component';
import { ModelInfoComponent } from './components/model-info/model-info.component';
import { NotesComponent } from './components/notes/notes.component';
import { LocalDatePipe, LocalDateTimePipe, LocalizationService, MatPaginationIntlService } from '../util/localization.service';
import { OwaspRREntryComponent } from './components/owasp-rr-entry/owasp-rr-entry.component';
import { RenameDialogComponent } from './components/rename-dialog/rename-dialog.component';
import { TagsComponent } from './components/tags/tags.component';
import { CveSearchComponent } from './components/cve-search/cve-search.component';
import { CveEntryComponent } from './components/cve-entry/cve-entry.component';
import { ImageViewComponent } from './components/image-view/image-view.component';
import { GlossaryComponent } from './components/glossary/glossary.component';

@NgModule({
  declarations: [
    PageNotFoundComponent, WebviewDirective, 
    StatusBarComponent, SideNavComponent, SaveDialogComponent, PasswordDialogComponent, MessagesDialogComponent, 
    TwoOptionsDialogComponent, CweEntryComponent, CapecEntryComponent, NavTreeComponent, CvssEntryComponent, OwaspRREntryComponent,
    ProgressTrackerComponent, ModelInfoComponent, NotesComponent, 
    LocalDatePipe, LocalDateTimePipe, RenameDialogComponent, TagsComponent, CveSearchComponent, CveEntryComponent, ImageViewComponent, GlossaryComponent
  ],
  imports: [
    CommonModule, 
    RouterModule,
    TranslateModule, 
    FormsModule,
    ReactiveFormsModule,

    FontAwesomeModule,
    TourMatMenuModule,
    AngularSplitModule,
    AngularResizeEventModule,
    NgxChartsModule,
    NgxMatColorPickerModule,
  
    ClipboardModule,
    CdkTableModule,
    CdkTreeModule,
    DragDropModule,
    ScrollingModule,
    MatIconModule,
    MatSidenavModule,
    MatBadgeModule,
    MatTreeModule,
    MatCheckboxModule,
    MatButtonModule,
    MatToolbarModule,
    MatSelectModule,
    MatTabsModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCardModule,
    MatListModule,
    MatMenuModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatButtonToggleModule,
    MatRadioModule,
    MatDialogModule,
    MatAutocompleteModule,
    MatSliderModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRippleModule,
    MatTableModule,
    MatSortModule,
    MatStepperModule,
    MatProgressBarModule,
    MatPaginatorModule
  ],
  exports: [
    TranslateModule, 
    WebviewDirective, 
    FormsModule,
    ReactiveFormsModule,

    FontAwesomeModule,
    AngularSplitModule,
    AngularResizeEventModule,
    NgxChartsModule,
    NgxMatColorPickerModule,
  
    ClipboardModule,
    CdkTableModule,
    CdkTreeModule,
    DragDropModule,
    ScrollingModule,
    MatIconModule,
    MatSidenavModule,
    MatBadgeModule,
    MatTreeModule,
    MatCheckboxModule,
    MatButtonModule,
    MatToolbarModule,
    MatSelectModule,
    MatTabsModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCardModule,
    MatListModule,
    MatMenuModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatButtonToggleModule,
    MatRadioModule,
    MatDialogModule,
    MatAutocompleteModule,
    MatSliderModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRippleModule,
    MatTableModule,
    MatSortModule,
    MatStepperModule,
    MatProgressBarModule,
    MatPaginatorModule,

    StatusBarComponent,
    SideNavComponent,
    CweEntryComponent,
    CapecEntryComponent,
    CvssEntryComponent,
    NavTreeComponent,
    NotesComponent,
    ModelInfoComponent,
    TagsComponent,
    CveEntryComponent,

    LocalDatePipe,
    LocalDateTimePipe
  ],
  providers: [
    { 
      provide: LOCALE_ID, 
      deps: [LocalizationService],
      useFactory: (translate) => translate.Locale
    },
    { provide: MatPaginatorIntl, useClass: MatPaginationIntlService },
    { provide: MAT_COLOR_FORMATS, useValue: NGX_MAT_COLOR_FORMATS }
  ]
})
export class SharedModule {}
