import { Component, ElementRef, EventEmitter, HostBinding, HostListener, KeyValueDiffer, KeyValueDiffers, ViewChild } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { APP_CONFIG } from '../environments/environment';
import { ThemeService } from './util/theme.service';
import { OverlayContainer } from '@angular/cdk/overlay';
import { IsLoadingService } from '@service-work/is-loading';
import { LocalStorageService, LocStorageKeys } from './util/local-storage.service';
import { Observable } from 'rxjs';
import { DataService } from './util/data.service';
import { DatabaseBase, DataChangedTypes, IDataChanged } from './model/database';

interface IDiff {
  key: string;
  sourceArray: DatabaseBase[];
  arrayDiffer: any; 
  differMap: Map<string, any>;
  objMap: Map<string, DatabaseBase>;
  event: EventEmitter<IDataChanged>;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  isLoading: Observable<boolean>;

  static BlockChanges = false;

  @HostBinding('class') className = '';
  @ViewChild('primary') primary: ElementRef;
  @ViewChild('accent') accent: ElementRef;

  constructor(
    private electronService: ElectronService, private translate: TranslateService,
    private theme: ThemeService, private locStorage: LocalStorageService,
    private overlay: OverlayContainer, private isLoadingService: IsLoadingService,
    public dataService: DataService, private kvDiffers: KeyValueDiffers
  ) {
    this.translate.setDefaultLang('en');

    window.onbeforeunload = (event) => {
      return this.dataService.OnClose(event);
    };
  }

  ngOnInit() {    
    this.isLoading = this.isLoadingService.isLoading$();

    document.onkeydown = (e) => {
      if (e.ctrlKey && e.key == 's') {
        e.preventDefault();
        this.dataService.Save();
      }
    };
  }

  ngAfterViewInit() {
    this.theme.ThemeChanged.subscribe((darkMode) => {
      const darkClassName = 'darkMode';
      if (darkMode) {
        document.body.classList.add(darkClassName);
        this.overlay.getContainerElement().classList.add(darkClassName);
      }
      else {
        document.body.classList.remove(darkClassName);
        this.overlay.getContainerElement().classList.remove(darkClassName);
      }
    });

    let lang = this.locStorage.Get(LocStorageKeys.LANGUAGE);
    if (lang != null) {
      this.translate.use(lang);
    }

    this.theme.Primary = getComputedStyle(this.primary.nativeElement).color;
    this.theme.Accent = getComputedStyle(this.accent.nativeElement).color;
    this.dataService.ProjectChanged.subscribe(() => this.createDiffers());
    this.dataService.ProjectSaved.subscribe(() => this.createDiffers());
  }

  private diffs: IDiff[];
  private isInitialized = false;

  private createDiffers() {
    this.diffs = [];
    this.configStr = this.projectStr = null;
    this.isInitialized = false;

    let config = this.dataService.Config;
    if (config != null) {
      this.configStr = JSON.stringify(config.ToJSON());
      this.configID = config.ID;
      /** 
       * Not used at the moment
      this.createDiffer(config.GetMyDatas(), null);
      this.createDiffer(config.GetAssetGroups(), null);
      this.createDiffer(config.GetStencilTypes(), null);
      this.createDiffer(config.GetStencilTypeTemplates(), null);
      this.createDiffer(config.GetProtocols(), null);
      this.createDiffer(config.GetMyComponentPTypes(), null);
      this.createDiffer(config.GetMyComponentSWTypes(), null);
      this.createDiffer(config.GetThreatCategoryGroups(), null);
      this.createDiffer(config.GetThreatCategories(), null);
      this.createDiffer(config.GetThreatCategories(), 'ImpactCats');
      this.createDiffer(config.GetThreatOriginGroups(), null);
      this.createDiffer(config.GetThreatOrigins(), null);
      this.createDiffer(config.GetThreatQuestions(), null);
      this.createDiffer(config.GetThreatRuleGroups(), null);
      this.createDiffer(config.GetThreatRules(), null);
    */
    }

    let project = this.dataService.Project;
    if (project != null) {
      this.projectStr = JSON.stringify(project.ToJSON());
      this.projectID = project.ID;
      this.createDiffer(project.GetDFDElements(), null, project.DFDElementsChanged);
      this.createDiffer(project.GetAttackScenarios(), null, project.AttackScenariosChanged);
      this.createDiffer(project.GetComponents(), null, project.MyComponentsChanged);
      this.createDiffer(project.GetComponents(), 'threatQuestions');
      this.createDiffer(project.GetDevices(), null, null);
      // this.createDiffer(project.GetContextFlows(), null, null);
      // this.createDiffer(project.GetSystemUseCases(), null, null);
      // this.createDiffer(project.GetDeviceInterfaces(), null, null);
      // this.createDiffer(project.GetInteractors(), null, null);
    }

    if (this.configStr || this.projectStr) {
      setTimeout(() => {
        AppComponent.BlockChanges = true;
        this.isInitialized = true;
        
        setTimeout(() => {
          AppComponent.BlockChanges = false;
        }, 1000);
      }, 500);
    }
  }

  private createDiffer(sourceArray: DatabaseBase[], key: string, event?) {
    let arrayDiffer = this.kvDiffers.find(sourceArray).create();
    let differMap = new Map<string, any>();
    let objMap = new Map<string, any>();

    sourceArray.forEach(item => {
      differMap[item.ID] = this.kvDiffers.find(key ? item.Data[key] : item.Data).create();
      objMap[item.ID] = key ? item.Data[key] : item.Data;
    });

    let diff: IDiff = {
      arrayDiffer: arrayDiffer,
      differMap: differMap,
      objMap: objMap,
      sourceArray: sourceArray,
      key: key,
      event: event
    };

    this.diffs.push(diff);
  }

  private configStr: string;
  private configID: string;
  private projectStr: string;
  private projectID: string;

  ngDoCheck() {
    if (this.configStr) {
      if (this.dataService.Config && this.configID == this.dataService.Config.ID) {
        if (!this.dataService.Config.FileChanged) {
          let val = JSON.stringify(this.dataService.Config.ToJSON());
          if (val !== this.configStr) {
            this.configStr = val;
            this.dataService.Config.FileChanged = true;
          }
        }
      }
      else {
        this.configStr = null;
      }
    }
    if (this.projectStr) {
      if (this.dataService.Project && this.projectID == this.dataService.Project.ID) {
        if (!this.dataService.Project.FileChanged) {
          let val = JSON.stringify(this.dataService.Project.ToJSON());
          if (val !== this.projectStr) {
            this.projectStr = val;
            this.dataService.Project.FileChanged = true;
          }
        }
      }
      else {
        this.projectStr = null;
      }
    }

    if (this.isInitialized) {
      this.diffs.forEach(diff => {
        let arrChanges = diff.arrayDiffer.diff(diff.sourceArray);
        if (arrChanges) {
          arrChanges.forEachAddedItem((record) => {
            let newItem = record.currentValue;
            diff.differMap.set(newItem.ID, this.kvDiffers.find(diff.key ? newItem.Data[diff.key] : newItem.Data).create());
            diff.objMap.set(newItem.ID, diff.key ? newItem.Data[diff.key] : newItem.Data);
            if (!AppComponent.BlockChanges) {
              if (diff.event) {
                diff.event.emit({ ID: newItem.ID, Type: DataChangedTypes.Added });
                newItem.DataChanged?.subscribe((val) => diff.event.emit({ ID: newItem.ID, Type: val.Type }));
              }
              //console.log('Added ' + newItem.Name);
            }
          });
          arrChanges.forEachRemovedItem((record) => {
            let oldItem = record.previousValue;
            diff.differMap.delete(oldItem.ID);
            diff.objMap.delete(oldItem.ID);
            if (diff.event) diff.event.emit({ ID: oldItem.ID, Type: DataChangedTypes.Removed });
            //console.log('Removed ' + oldItem.Name);
          });
        }
        diff.differMap.forEach((val, key) => {
          let objChanges = val.diff(diff.objMap.get(key));
          if (objChanges) {
            objChanges.forEachChangedItem(record => {
              if (!AppComponent.BlockChanges) {
                // console.log('--- Object with ID ' + key + ' updated ---');
                // console.log('Previous value: ' + record.previousValue);
                // console.log('Current value: ' + record.currentValue);
                if (diff.event) {
                  diff.event.emit({ ID: key, Type: DataChangedTypes.Changed });
                }
              }
            });
          }
        });  
      });
    }
  }
}
