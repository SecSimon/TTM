import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { IMessage } from '../../../util/messages.service';

@Component({
  selector: 'app-messages-dialog',
  templateUrl: './messages-dialog.component.html',
  styleUrls: ['./messages-dialog.component.scss']
})
export class MessagesDialogComponent implements OnInit {

  public showError = true;
  public showWarning = true;
  public showSuccess = true;
  public showInfo = true;

  public get filteredMessages(): IMessage[] {
    let res = this.messages;
    if (!this.showError) res = res.filter(x => x.type != 'error');
    if (!this.showWarning) res = res.filter(x => x.type != 'warning');
    if (!this.showSuccess) res = res.filter(x => x.type != 'success');
    if (!this.showInfo) res = res.filter(x => x.type != 'info');
    return res;
  }

  constructor(@Inject(MAT_DIALOG_DATA) public messages: IMessage[]) { }

  ngOnInit(): void {
  }

}
