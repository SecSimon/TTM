import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { INavigationNode } from '../shared/components/nav-tree/nav-tree.component';
import { SideNavBase } from '../shared/components/side-nav/side-nav-base';
import { DataService } from '../util/data.service';
import { LocalStorageService, LocStorageKeys } from '../util/local-storage.service';
import { ThemeService } from '../util/theme.service';

import { WarningDialogComponent } from './warning-dialog/warning-dialog.component';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent extends SideNavBase implements OnInit {

  private _selectedNode;

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
  }

  constructor(public theme: ThemeService, public dataService: DataService, private locStorageService: LocalStorageService, private dialog: MatDialog) { 
    super();
  }

  ngOnInit(): void {
    if (this.dataService.Project) {
      let askConsent = true;
      const remember = this.locStorageService.Get(LocStorageKeys.DIALOG_WARNING_CONSENT);
      if (remember) {
        const last = new Date(remember);
        const today = new Date();
        askConsent = !(last.getMonth() == today.getMonth() && last.getDate() == today.getDate());
      }

      if (askConsent) {
        const data = { consent: false, remember: false };
        const dialogRef = this.dialog.open(WarningDialogComponent, { hasBackdrop: false, data: data });
        dialogRef.afterClosed().subscribe(res => {
          if (res) {
            if (data.remember) {
              this.locStorageService.Set(LocStorageKeys.DIALOG_WARNING_CONSENT, new Date().toString());
            }
          }
        });
      }
    }
  }

  public GetSelectedTabIndex() {
    let index = this.locStorageService.Get(LocStorageKeys.PAGE_CONFIG_TAB_INDEX);
    if (index != null) return index;
    else return 0;
  }

  public SetSelectedTabIndex(event) {
    this.selectedNode = null;
    this.locStorageService.Set(LocStorageKeys.PAGE_CONFIG_TAB_INDEX, event);
  }

  public GetSplitSize(): number {
    let size = this.locStorageService.Get(LocStorageKeys.PAGE_CONFIG_SPLIT_SIZE_1);
    if (size != null) return Number(size);
    return 350;
  }

  public OnSplitSizeChange(event) {
    this.locStorageService.Set(LocStorageKeys.PAGE_CONFIG_SPLIT_SIZE_1, event['sizes'][0]);
  }
}
