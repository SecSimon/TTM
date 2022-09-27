import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ThemeService } from '../util/theme.service';
import { DataService, UserModes } from '../util/data.service';
import { MatDialog } from '@angular/material/dialog';
import { LocalStorageService, LocStorageKeys } from '../util/local-storage.service';

import { WelcomeDialogComponent } from './Dialogs/welcome-dialog/welcome-dialog.component';
import { TourService } from 'ngx-ui-tour-md-menu';
import { TranslateService } from '@ngx-translate/core';
import { ITTMStage, TTMService } from '../util/ttm.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public processStep: number = null;

  public get Stages(): ITTMStage[] { return this.ttmService.Stages; }

  constructor(private router: Router, private route: ActivatedRoute, private theme: ThemeService, public dataService: DataService, private dialog: MatDialog,
    private locStorage: LocalStorageService, public tourService: TourService, private translate: TranslateService, private ttmService: TTMService) { }

  ngOnInit(): void {
    let createStep = (anchor: string) => {
      return {
        anchorId: anchor,
        content: this.translate.instant('tour.' + anchor + '.content'),
        title: this.translate.instant('tour.' + anchor + '.title'),
        route: '',
        enableBackdrop: true,
        prevBtnTitle: this.translate.instant('tour.prev'),
        nextBtnTitle: this.translate.instant('tour.next'),
        endBtnTitle: this.translate.instant('tour.end'),
      }
    }

    this.translate.get('tour.change-settings.title').subscribe(() => {
      // wait until translate service is available
      let lang = this.locStorage.Get(LocStorageKeys.LANGUAGE);
      if (!lang || lang.length == 0) {
        // this.dialog.open(WelcomeDialogComponent);
        // skip welcome, set language
        this.locStorage.Set(LocStorageKeys.LANGUAGE, 'en');
      }

      this.tourService.initialize([
        createStep('change-settings'),
        createStep('message-history'),
        createStep('save-file'),
        createStep('set-progress')
      ]);
      if ([UserModes.LoggedIn, UserModes.Guest].includes(this.dataService.UserMode)) {
        let wcs = this.locStorage.Get(LocStorageKeys.WELCOME_TOUR_STARTED);
        if (!wcs) {
          this.tourService.start();
          this.locStorage.Set(LocStorageKeys.WELCOME_TOUR_STARTED, JSON.stringify(true));
        }
      }
    });

    let dest = 'modeling';
    this.route.queryParams.subscribe(params => {
      if (params['origin'] != null) {
        dest = params['origin'];
      }
    });

    this.dataService.ProjectChanged.subscribe(x => this.router.navigate(['/' + dest]));
  }

  public GetRepoName(file) {
    return this.dataService.GetRepoOfFile(file)?.name;
  }

  public SetProcessStep(index: number) {
    this.processStep = index;
  }

  public NextProcessStep() {
    this.processStep++;
  }

  public PrevProcessStep() {
    this.processStep--;
  }
}