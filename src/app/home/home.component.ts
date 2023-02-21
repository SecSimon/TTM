import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ThemeService } from '../util/theme.service';
import { DataService, UserModes } from '../util/data.service';
import { LocalStorageService, LocStorageKeys } from '../util/local-storage.service';

import { WelcomeDialogComponent } from './Dialogs/welcome-dialog/welcome-dialog.component';
import { TourService } from 'ngx-ui-tour-md-menu';
import { TranslateService } from '@ngx-translate/core';
import { ITTMStage, TTMService } from '../util/ttm.service';
import { ElectronService } from '../core/services';
import { DialogService } from '../util/dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { LanguageDialogComponent } from './Dialogs/language-dialog/language-dialog.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public processStep: number = null;

  public get Stages(): ITTMStage[] { return this.ttmService.Stages; }

  public VideoURL: SafeResourceUrl = null;
  public get HasCookieConsent(): boolean {
    let consent = this.locStorage.Get(LocStorageKeys.COOKIE_CONSENT);
    if (consent != null) return JSON.parse(consent);
    return false;
  }

  constructor(private router: Router, private route: ActivatedRoute, private theme: ThemeService, public dataService: DataService, private dialogService: DialogService, private dialog: MatDialog,
    private locStorage: LocalStorageService, public tourService: TourService, private translate: TranslateService, private electronService: ElectronService, 
    private ttmService: TTMService, private sanitizer: DomSanitizer) {
      this.VideoURL = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube-nocookie.com/embed/videoseries?list=PLSMRtuVN409fB35RLljjg3jNkVJbLIP1u');
    }

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
      const startTourGetConsent = () => {
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

        let consent = this.locStorage.Get(LocStorageKeys.COOKIE_CONSENT);
        if (consent == null) this.dialogService.OpenCookieConsentDialog();
      };
      // wait until translate service is available
      let lang = this.locStorage.Get(LocStorageKeys.LANGUAGE);
      if (!lang || lang.length == 0) {
        // this.dialog.open(WelcomeDialogComponent);
        // skip welcome, set language
        // if ((navigator.language || navigator.languages).includes('de')) this.locStorage.Set(LocStorageKeys.LANGUAGE, 'de');
        // else this.locStorage.Set(LocStorageKeys.LANGUAGE, 'en');
        this.dialog.open(LanguageDialogComponent).afterClosed().subscribe(x => {
          startTourGetConsent();
        });
      }
      else {
        startTourGetConsent();
      }
    });

    let dest = 'modeling';
    this.route.queryParams.subscribe(params => {
      if (params['origin'] != null) {
        dest = params['origin'];
      }
    });

    if (this.electronService.isElectron) {
      this.electronService.ipcRenderer.on('oncode', (e, args) => {
        this.dataService.LogIn(args);
      });
    }

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

  public ProgressTracker() {
    this.NextProcessStep();
    this.dialogService.OpenProgresstrackerDialog();
  }
}