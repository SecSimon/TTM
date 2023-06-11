import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';

import { HomeModule } from './home/home.module';
import { LoginModule } from './login/login.module';
import { ModelingModule } from './modeling/modeling.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MitigationOverviewModule } from './mitigation-overview/mitigation-overview.module';
import { ReportingModule } from './reporting/reporting.module';
import { ConfigurationModule } from './configuration/configuration.module';

import { AppComponent } from './app.component';
import { RiskOverviewModule } from './risk-overview/risk-overview.module';

// AoT requires an exported function for factories
const httpLoaderFactory = (http: HttpClient): TranslateHttpLoader => {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
};

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    CoreModule,
    SharedModule,
    HomeModule,
    LoginModule,
    ModelingModule,
    DashboardModule,
    MitigationOverviewModule,
    RiskOverviewModule,
    ReportingModule,
    ConfigurationModule,
    AppRoutingModule,
    TourMatMenuModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
