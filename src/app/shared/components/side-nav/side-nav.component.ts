import { Component, Input, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { ThemeService } from '../../../util/theme.service';
import { LocalStorageService, LocStorageKeys } from '../../../util/local-storage.service';
import { DataService } from '../../../util/data.service';

import { faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import { MessagesService } from '../../../util/messages.service';
import { Router } from '@angular/router';
import { DialogService } from '../../../util/dialog.service';
import { LocalizationService } from '../../../util/localization.service';


@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent implements AfterViewInit {

  @Input()
  public selectedRoute: string = '';

  @Output()
  public sameRoute = new EventEmitter();

  public faCodeBranch = faCodeBranch;

  constructor(public theme: ThemeService, private localization: LocalizationService, private locStorage: LocalStorageService, 
    public dataService: DataService, public messagesService: MessagesService, private router: Router, private dialog: DialogService) { }

  ngAfterViewInit(): void {
    this.setSelectedClass(this.theme.IsDarkMode);
    this.theme.ThemeChanged.subscribe((val) => this.setSelectedClass(val));
  }

  public IsSelected(route: string, isDarkMode = false) {
    return route == this.selectedRoute && this.theme.IsDarkMode == isDarkMode;
  }

  public IsHoveredOrSelected(route: string, isDarkMode = false) {
    return this.IsSelected(route, isDarkMode) || (route == this.hovered && this.theme.IsDarkMode == isDarkMode);
  }

  public ChangeLanguage(lang: string) {
    this.localization.Locale = lang;
  }

  public Clear() {
    let clear = () => {
      this.locStorage.Clear();
      window.location.reload();
    };

    if (this.dataService.HasUnsavedChanges) {
      this.dialog.OpenUnsavedChangesDialog().subscribe(res => {
        if (res) {
          this.dataService.Save().then(() => clear());
        }
        else {
          clear();
        }
      })
    }
    else {
      clear();
    }
  }

  public ResetLayout() {
    let reset = () => {
      this.locStorage.ResetLayout();
      window.location.reload();
    };

    if (this.dataService.HasUnsavedChanges) {
      this.dialog.OpenUnsavedChangesDialog().subscribe(res => {
        if (res) {
          this.dataService.Save().then(() => reset());
        }
        else {
          reset();
        }
      })
    }
    else {
      reset();
    }
  }

  public OpenGitHubUrl() {
    window.open(this.dataService.UserURL, '_blank');
  }

  private hovered: string;
  public OnMouseEnter(route: string) { this.hovered = route; }
  public OnMouseLeave() { this.hovered = ''; }

  public OnClick(route: string) {
    if (route == this.router.url) this.sameRoute.emit();
    else this.router.navigate([route]);
  }

  private setSelectedClass(isDarkMode: boolean) {
    if (this.selectedRoute != '') {
      let allButtons = document.getElementsByClassName('sidenav-icon-button');
      //let allButtons = document.getElementsByName('btnIcon');
      for (let i = 0; i < allButtons.length; i++) {
        allButtons[i].classList.remove('btn-selected-dark');
        allButtons[i].classList.remove('btn-selected-light');
        if (allButtons[i]['name'] && allButtons[i]['name'].endsWith(this.selectedRoute)) {
          if (isDarkMode) allButtons[i].classList.add('btn-selected-dark');
          else allButtons[i].classList.add('btn-selected-light');
        }
      }
    }
  }
}
