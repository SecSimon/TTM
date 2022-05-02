import { EventEmitter, Injectable } from '@angular/core';
import { LocalStorageService, LocStorageKeys } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  constructor(private locStorageService: LocalStorageService) {
    setTimeout(() => {
      let dm = this.locStorageService.Get(LocStorageKeys.DARK_MODE);
      if (dm == null) this.SetDarkMode(this.IsDarkMode);
      else this.SetDarkMode(dm == "true"); 
    }, 100);
  }

  public ThemeChanged = new EventEmitter<boolean>();
  public IsDarkMode: boolean = true;
  public Primary: string;
  public Accent: string;
  public get Color2(): string {
    if (this.IsDarkMode) return '#252525';
    else return '#F5F5F5';
  }

  public SetDarkMode(isDarkMode: boolean) {
    this.ThemeChanged.emit(isDarkMode);
    this.IsDarkMode = isDarkMode;
    this.locStorageService.Set(LocStorageKeys.DARK_MODE, String(this.IsDarkMode));
  }
}
