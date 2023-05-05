import { Component, OnInit } from '@angular/core';
import { DataService } from '../../../util/data.service';
import { TranslateService } from '@ngx-translate/core';
import { StringExtension } from '../../../util/string-extension';

@Component({
  selector: 'app-file-info-dialog',
  templateUrl: './file-info-dialog.component.html',
  styleUrls: ['./file-info-dialog.component.scss']
})
export class FileInfoDialogComponent implements OnInit {

  public Changes: string[] = [];

  constructor(public dataService: DataService, private translate: TranslateService) { }

  ngOnInit(): void {
    this.UpdateChanges();
  }

  public UpdateChanges() {
    this.Changes = [];
    if (this.dataService.Project) {
      this.dataService.Project.GetLog().forEach(entry => {
        let title: string = entry.Title;
        if (!title.includes('.')) {
          title = this.translate.instant('general.' + entry.Title);
          if (title.includes('general.')) title = this.translate.instant('properties.' + entry.Title);
          if (title.includes('properties.')) title = StringExtension.FromCamelCase(entry.Title);
        }
        let str = StringExtension.Format(this.translate.instant('messages.changes.' + entry.Type.toString()), this.translate.instant(title));
        if (entry.Name) str += ': ' + entry.Name;
        this.Changes.push(str);
      });
    }
  }
}
