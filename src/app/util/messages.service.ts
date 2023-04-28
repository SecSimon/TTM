import { Injectable } from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MessagesDialogComponent } from '../shared/components/messages-dialog/messages-dialog.component';

import { TranslateService } from '@ngx-translate/core';
import { LocalStorageService, LocStorageKeys } from './local-storage.service';

export interface IMessage {
  type: string;
  text: string;
  time: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessagesService {

  private readonly TIMEOUT = 3000;

  public readonly Messages: IMessage[] = [];

  public get ErrorMsgs(): IMessage[] { return this.Messages.filter(x => x.type == 'error'); }
  public get WarningMsgs(): IMessage[] { return this.Messages.filter(x => x.type == 'warning'); }
  public get SuccessMsgs(): IMessage[] { return this.Messages.filter(x => x.type == 'success'); }
  public get InfoMsgs(): IMessage[] { return this.Messages.filter(x => x.type == 'info'); }

  public get ShowErrors(): boolean {
    let res = this.locStorage.Get(LocStorageKeys.MSG_SHOW_ERROR);
    if (res == null) return true;
    return res == 'true';
  } 
  public set ShowErrors(val: boolean) { this.locStorage.Set(LocStorageKeys.MSG_SHOW_ERROR, String(val)); }
  public get ShowWarnings(): boolean {
    let res = this.locStorage.Get(LocStorageKeys.MSG_SHOW_WARNING);
    if (res == null) return true;
    return res == 'true';
  } 
  public set ShowWarnings(val: boolean) { this.locStorage.Set(LocStorageKeys.MSG_SHOW_WARNING, String(val)); }
  public get ShowSuccesses(): boolean {
    let res = this.locStorage.Get(LocStorageKeys.MSG_SHOW_SUCCESS);
    if (res == null) return true;
    return res == 'true';
  } 
  public set ShowSuccesses(val: boolean) { this.locStorage.Set(LocStorageKeys.MSG_SHOW_SUCCESS, String(val)); }
  public get ShowInfos(): boolean {
    let res = this.locStorage.Get(LocStorageKeys.MSG_SHOW_INFO);
    if (res == null) return true;
    return res == 'true';
  } 
  public set ShowInfos(val: boolean) { this.locStorage.Set(LocStorageKeys.MSG_SHOW_INFO, String(val)); }
  public get ShowUnsavedChanges(): boolean {
    let res = this.locStorage.Get(LocStorageKeys.MSG_SHOW_UNSAVED_CHANGED);
    if (res == null) return true;
    return res == 'true';
  } 
  public set ShowUnsavedChanges(val: boolean) { this.locStorage.Set(LocStorageKeys.MSG_SHOW_UNSAVED_CHANGED, String(val)); }

  constructor(private snackBar: MatSnackBar, private translateService: TranslateService, 
    private locStorage: LocalStorageService, public dialog: MatDialog) {
    window.onerror = (msg, source, line, col, err) => {
      if (!msg.toString().startsWith('ResizeObserver loop limit')) this.Error(msg.toString(), [source, line, col, err]);
      return false;
    };
  }

  public Info(text: string, params?: any) {
    let translatedMessage = this.buildMsg(text, params);
    this.Messages.unshift({ text: translatedMessage, type: 'info', time: new Date().toString() });
    if (this.ShowInfos) this.snackBar.open(translatedMessage, null, { duration: this.TIMEOUT, panelClass: 'messages-info' });
  }

  public Success(text: string, params?: any) {
    let translatedMessage = this.buildMsg(text, params);
    this.Messages.unshift({ text: translatedMessage, type: 'success', time: new Date().toString() });
    if (this.ShowSuccesses) this.snackBar.open(translatedMessage, null, { duration: this.TIMEOUT, panelClass: 'messages-success' });
  }

  public Warning(text: string, params?: any) {
    let translatedMessage = this.buildMsg(text, params);
    this.Messages.unshift({ text: translatedMessage, type: 'warning', time: new Date().toString() });
    if (this.ShowWarnings) this.snackBar.open(translatedMessage, null, { duration: this.TIMEOUT, panelClass: 'messages-warning' });
  }

  public Error(text: string, params?: any) {
    let translatedMessage = this.buildMsg(text, params);
    this.Messages.unshift({ text: translatedMessage, type: 'error', time: new Date().toString() });
    console.error(translatedMessage);
    if (this.ShowErrors) this.snackBar.open(translatedMessage, null, { duration: this.TIMEOUT, panelClass: 'messages-error' });
  }

  public UnsavedChanges(text: string, params?: any) {
    let translatedMessage = this.buildMsg(text, params);
    this.snackBar.open(translatedMessage, null, { duration: this.TIMEOUT, panelClass: 'messages-warning' });
  }

  public ShowHistory() {
    const dialogRef = this.dialog.open(MessagesDialogComponent, { hasBackdrop: true, data: this.Messages });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.Messages.length = 0;
      }
    });
  }

  private buildMsg(text: string, params?: any): string {
    let translatedMessage = '';
    try {
      translatedMessage = this.translateService.instant(text);
    }
    catch {
      translatedMessage = text;
    }
    if (params && typeof params === 'string') { translatedMessage += ' ' + params; }
    else if (params && this.getParamType(params) == 'Array') { 
      translatedMessage += ' ';
      params.forEach(x => {
        translatedMessage += String(x) + '; '
      });

      translatedMessage = translatedMessage.substring(0, translatedMessage.length-2);
    }
    else if (params && this.getParamType(params) == 'Object') {
      translatedMessage = translatedMessage + '\n' + JSON.stringify(params, null, 2);
    }
    else if (params) {
      translatedMessage = translatedMessage + ' Unknown parameters, see console';
      console.log(params);
    }

    return translatedMessage;
  }

  private getParamType(object) {
    if (object === null) {
      return "null";
    }
    if (object === undefined) {
      return "undefined";
    }
    if (object.constructor === "test".constructor) {
      return "String";
    }
    if (object.constructor === [].constructor) {
      return "Array";
    }
    if (object.constructor === ({}).constructor) {
      return "Object";
    }
    {
      return '';
    }
  }
}