import { Component, OnInit } from '@angular/core';
import { DataService, IGHFile } from '../../../util/data.service';
import { MessagesService } from '../../../util/messages.service';

import { faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import { MatDialog } from '@angular/material/dialog';

import versionFile from '../../../../assets/version.json';
import { DialogService } from '../../../util/dialog.service';
import { LocalStorageService, LocStorageKeys } from '../../../util/local-storage.service';
import { StringExtension } from '../../../util/string-extension';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrls: ['./status-bar.component.scss']
})
export class StatusBarComponent implements OnInit {

  public faCodeBranch = faCodeBranch;

  public version: string;

  public showDebug: boolean = false;

  constructor(public messagesService: MessagesService, public dataService: DataService, public dialogService: DialogService, 
    private locStorage: LocalStorageService, private translate: TranslateService) { }

  ngOnInit(): void {
    this.version = versionFile.version;
    const lastVersion = this.locStorage.Get(LocStorageKeys.CURRENT_VERSION);
    if (lastVersion && this.version != lastVersion) {
      setTimeout(() => {
        this.messagesService.Info(StringExtension.Format(this.translate.instant('messages.info.versionUpdate'), this.version));
      }, 5000);
    }
    this.locStorage.Set(LocStorageKeys.CURRENT_VERSION, this.version);
  }

  public GetProgress() {
    if (this.dataService.Project) {
      let vals = Object.values(this.dataService.Project.ProgressTracker);
      if (vals.length == 0) return '0%';
      
      return  (100 * vals.filter(x => x == true).length / vals.length).toFixed(0) + '%';
    }
  }
}
