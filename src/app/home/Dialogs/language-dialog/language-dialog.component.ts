import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorageService, LocStorageKeys } from '../../../util/local-storage.service';

@Component({
  selector: 'app-language-dialog',
  templateUrl: './language-dialog.component.html',
  styleUrls: ['./language-dialog.component.scss']
})
export class LanguageDialogComponent implements OnInit {

  constructor(private translateService: TranslateService, private locStorage: LocalStorageService) { }

  ngOnInit(): void {
  }

  public ChangeLanguage(lang: string) {
    this.translateService.use(lang);
    this.locStorage.Set(LocStorageKeys.LANGUAGE, lang);
  }
}
