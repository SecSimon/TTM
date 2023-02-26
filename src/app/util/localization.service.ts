import { Injectable, Pipe, PipeTransform } from '@angular/core';

import { formatDate, registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorageService, LocStorageKeys } from './local-storage.service';
import { MatPaginatorIntl } from '@angular/material/paginator';

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

@Injectable()
export class MatPaginationIntlService extends MatPaginatorIntl {
  constructor(private translateService: TranslateService) {
    super();

    // React whenever the language is changed
    this.translateService.onLangChange.subscribe((_event: Event) => {
      this.translateLabels();
    });

    // Initialize the translations once at construction time
    this.translateLabels();
  }

  public getRangeLabel = (page: number, pageSize: number, length: number): string => {
    const of = this.translateService ? this.translateService.instant("paginator.of") : "of";
    if (length === 0 || pageSize === 0) {
      return "0 " + of + " " + length;
    }
    length = Math.max(length, 0);
    const startIndex = page * pageSize > length ? (Math.ceil(length / pageSize) - 1) * pageSize : page * pageSize;

    const endIndex = Math.min(startIndex + pageSize, length);
    return startIndex + 1 + " - " + endIndex + " " + of + " " + length;
  };

  public injectTranslateService(translate: TranslateService): void {
    this.translateService = translate;

    this.translateService.onLangChange.subscribe(() => {
      this.translateLabels();
    });

    this.translateLabels();
  }

  translateLabels(): void {
    this.firstPageLabel = this.translateService.instant("paginator.firstPage");
    this.itemsPerPageLabel = this.translateService.instant("paginator.itemsPerPage");
    this.lastPageLabel = this.translateService.instant("paginator.lastPage");
    this.nextPageLabel = this.translateService.instant("paginator.nextPage");
    this.previousPageLabel = this.translateService.instant("paginator.previousPage");
    this.changes.next(); // Fire a change event to make sure that the labels are refreshed
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
