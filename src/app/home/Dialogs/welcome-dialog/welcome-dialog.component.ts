import { Component, OnInit } from '@angular/core';
import { StepperSelectionEvent, STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorageService, LocStorageKeys } from '../../../util/local-storage.service';
import { ThemeService } from '../../../util/theme.service';
import { TourService } from 'ngx-ui-tour-md-menu';

@Component({
  selector: 'app-welcome-dialog',
  templateUrl: './welcome-dialog.component.html',
  styleUrls: ['./welcome-dialog.component.scss'],
  providers: [{
    provide: STEPPER_GLOBAL_OPTIONS, useValue: {displayDefaultIndicatorType: false}
  }]
})
export class WelcomeDialogComponent implements OnInit {

  constructor(public theme: ThemeService, private translateService: TranslateService, private locStorage: LocalStorageService,
    private tourService: TourService) { }

  ngOnInit(): void {
  }

  public ChangeLanguage(lang: string) {
    this.translateService.use(lang);
    this.locStorage.Set(LocStorageKeys.LANGUAGE, lang);
  }

  public OnStepChanged(event: StepperSelectionEvent) {
    if (event.selectedIndex == 3) {
      this.tourService.start();
    }
  }
}
