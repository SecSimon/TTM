import { Injectable, Pipe, PipeTransform } from '@angular/core';

import { formatDate, registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorageService, LocStorageKeys } from './local-storage.service';

registerLocaleData(localeDe, 'de', localeDeExtra);

@Pipe({
  name: 'localDate'
})
export class LocalDatePipe implements PipeTransform {

  constructor(private localization: LocalizationService) { }

  transform(value: any, format: string = null) {
    if (!value) { return ''; }
    if (!format) { format = 'shortDate'; }

    return formatDate(value, format, this.localization.Locale);       
  }
}

@Pipe({
  name: 'localDateTime'
})
export class LocalDateTimePipe implements PipeTransform {

  constructor(private localization: LocalizationService) { }

  transform(value: any, format: string = null) {
    if (!value) { return ''; }
    if (!format) { format = 'medium'; }

    return formatDate(value, format, this.localization.Locale);       
  }
}


@Injectable({
  providedIn: 'root'
})
export class LocalizationService {
  private locale: string;

  public get Locale(): string {
    return this.locale || 'en';
  }
  public set Locale(val: string) {
    this.locale = val;

    this.translate.use(val);
    this.locStorage.Set(LocStorageKeys.LANGUAGE, val);
  }

  constructor(private translate: TranslateService, private locStorage: LocalStorageService) {
    this.locale = this.locStorage.Get(LocStorageKeys.LANGUAGE)
  }
}
