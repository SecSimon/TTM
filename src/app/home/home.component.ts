import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ThemeService } from '../util/theme.service';
import { DataService, FileSources, IFile, UserModes } from '../util/data.service';
import { LocalStorageService, LocStorageKeys } from '../util/local-storage.service';

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

  public pageProjectSize = 5;
  public pageConfigSize = 5;
  public pageGHProjectIndex = 0;
  public pageGHConfigIndex = 0;
  public pageFSProjectIndex = 0;
  public pageFSConfigIndex = 0;

  public toolBenefits = ['platform', 'onlineStorage', 'offlineStorage', 'libraries', 'libraryIntegration', 'guidelines', 'diagramming', 'riskAssessment', 'dashboard', 'reports', 'export', 'languages', 'collaboration'];

  constructor(private router: Router, private route: ActivatedRoute, private theme: ThemeService, public dataService: DataService, private dialogService: DialogService, private dialog: MatDialog,
    private locStorage: LocalStorageService, public tourService: TourService, private translate: TranslateService, public electron: ElectronService, 
    private ttmService: TTMService, private sanitizer: DomSanitizer) {
      this.VideoURL = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube-nocookie.com/embed/videoseries?list=PLSMRtuVN409fB35RLljjg3jNkVJbLIP1u');
    }

  ngOnInit(): void {
    const createStep = (anchor: string) => {
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
      const getConsentInitTour = () => {
        this.tourService.initialize([
          createStep('change-settings'),
          createStep('message-history'),
          createStep('save-file'),
          createStep('set-progress')
        ]);

        const consent = this.locStorage.Get(LocStorageKeys.COOKIE_CONSENT);
        if (consent == null) this.dialogService.OpenCookieConsentDialog().subscribe(x => this.CheckTourStart());
        else this.CheckTourStart();
      };

      // wait until translate service is available
      const lang = this.locStorage.Get(LocStorageKeys.LANGUAGE);
      if (!lang || lang.length == 0) {
        // this.dialog.open(WelcomeDialogComponent);
        // skip welcome, set language
        // if ((navigator.language || navigator.languages).includes('de')) this.locStorage.Set(LocStorageKeys.LANGUAGE, 'de');
        // else this.locStorage.Set(LocStorageKeys.LANGUAGE, 'en');
        this.dialog.open(LanguageDialogComponent).afterClosed().subscribe(x => {
          getConsentInitTour();
        });
      }
      else {
        getConsentInitTour();
      }
    });

    let dest = 'modeling';
    this.route.queryParams.subscribe(params => {
      if (params['origin'] != null) {
        dest = params['origin'];
      }
    });

    this.dataService.ProjectChanged.subscribe(x => {
      if (x != null) this.router.navigate(['/' + dest])
    });
  }

  public CheckTourStart() {
    if ([UserModes.LoggedIn, UserModes.Guest].includes(this.dataService.UserMode)) {
      const wcs = this.locStorage.Get(LocStorageKeys.WELCOME_TOUR_STARTED);
      if (!wcs) {
        this.tourService.start();
        this.locStorage.Set(LocStorageKeys.WELCOME_TOUR_STARTED, JSON.stringify(true));
      }
    }
  }

  public GetRepoName(file) {
    return this.dataService.GetRepoOfFile(file)?.name;
  }

  public IsProtected(file) {
    return !this.dataService.GetRepoOfFile(file)?.isWritable;
  }

  public GetAvailableGHProjects() {
    return this.dataService.AvailableGHProjects.slice(this.pageGHProjectIndex*this.pageProjectSize, (this.pageGHProjectIndex+1)*this.pageProjectSize);
  }

  public GetAvailableGHConfigs() {
    return this.dataService.AvailableGHConfigs.slice(this.pageGHConfigIndex*this.pageConfigSize, (this.pageGHConfigIndex+1)*this.pageConfigSize);
  }

  public GetAvailableFSProjects() {
    return this.dataService.AvailableFSProjects.slice(this.pageFSProjectIndex*this.pageProjectSize, (this.pageFSProjectIndex+1)*this.pageProjectSize);
  }

  public GetAvailableFSConfigs() {
    return this.dataService.AvailableFSConfigs.slice(this.pageFSConfigIndex*this.pageConfigSize, (this.pageFSConfigIndex+1)*this.pageConfigSize);
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

  public GetFileIcon(file: IFile) {
    return file.source == FileSources.FileSystem ? 'file_present' : 'cloud_queue';
  }

  public CutName(val: string): string {
    if (val && val.length > 35) {
      return '[...]' + val.substring(val.length-30);
    }

    return val;
  }
}