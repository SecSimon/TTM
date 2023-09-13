import { Component, OnInit } from '@angular/core';
import { DataService } from '../../../util/data.service';
import { MessagesService } from '../../../util/messages.service';

import { faCodeBranch } from '@fortawesome/free-solid-svg-icons';

import versionFile from '../../../../assets/version.json';
import { DialogService } from '../../../util/dialog.service';
import { LocalStorageService } from '../../../util/local-storage.service';
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
  }

  public GetProgress() {
    if (this.dataService.Project) {
      let vals = Object.values(this.dataService.Project.ProgressTracker);
      if (vals.length == 0) return '0%';
      
      return  (100 * vals.filter(x => x == true).length / vals.length).toFixed(0) + '%';
    }
  }

  public ShowDebugBtns() {
    this.showDebug = !this.showDebug
  }

  public OpenChangelog() {
    this.dialogService.OpenChangelogDialog();
  }
}
