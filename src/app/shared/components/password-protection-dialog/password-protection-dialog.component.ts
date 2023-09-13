import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DataService } from '../../../util/data.service';
import { StringExtension } from '../../../util/string-extension';
import { MessagesService } from '../../../util/messages.service';

@Component({
  selector: 'app-password-protection-dialog',
  templateUrl: './password-protection-dialog.component.html',
  styleUrls: ['./password-protection-dialog.component.scss']
})
export class PasswordProtectionDialogComponent implements OnInit {

  public IsEncrypted: boolean;
  public RemovePassword: boolean;
  public NewPassword: string;
  public ShowNewPassword: boolean;
  public ChangePassword: string;
  public ShowChangePassword: boolean ;

  public get HasChanges(): boolean {
    if (this.IsEncrypted) {
      return this.RemovePassword || !StringExtension.NullOrEmpty(this.ChangePassword);
    }
    else {
      return !StringExtension.NullOrEmpty(this.NewPassword);
    }
  }

  constructor(public dialogRef: MatDialogRef<PasswordProtectionDialogComponent>, public dataService: DataService, private messageService: MessagesService) { }

  ngOnInit(): void {
    this.initalizeProperties();
  }

  public Change() {
    if (this.IsEncrypted) {
      if (this.RemovePassword) this.dataService.RemovePassword();
      else this.dataService.SetPassword(this.ChangePassword);
    }
    else {
      this.dataService.SetPassword(this.NewPassword);
    }

    this.messageService.Info('messages.info.changesActiveAfterSaving');
    this.initalizeProperties();
  }

  private initalizeProperties() {
    this.IsEncrypted = this.dataService.SelectedFile.isEncrypted;
    this.RemovePassword = false;
    this.NewPassword = '';
    this.ShowNewPassword = false;
    this.ChangePassword = '';
    this.ShowChangePassword = false;
  }
}
