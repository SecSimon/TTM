import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

import versionFile from '../../../../assets/version.json';
import { IKeyValue } from '../../../model/database';

@Component({
  selector: 'app-changelog-dialog',
  templateUrl: './changelog-dialog.component.html',
  styleUrls: ['./changelog-dialog.component.scss']
})
export class ChangelogDialogComponent implements OnInit {

  public Version: string = versionFile.version;
  public Versions: IKeyValue[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.http.get('https://raw.githubusercontent.com/SecSimon/TTM/main/CHANGELOG.md', { responseType: 'text' }).subscribe(res => {
      try {
        let currVersion = null;
        res.split('\n').forEach(line => {
          if (line.startsWith('#')) {
            currVersion = line.replace(/#/g, '').trim();
            this.Versions.push({ Key: currVersion, Value: [] });
          }
          else if (currVersion && line.startsWith('*')) {
            this.Versions[this.Versions.length-1].Value.push(line.replace('*', '').trim());
          }
        });
      }
      catch {

      }
    });
  }

  public IsNewerVersion(tag: string): boolean {
    const currArr = this.Version.replace('v', '').split('.');
    const tagArr = tag.replace('v', '').split('.');

    if (currArr.length == tagArr.length) {
      for (let i = 0; i < currArr.length; i++) {
        if (Number(tagArr[i]) > Number(currArr[i])) return true;
        else if (Number(tagArr[i]) < Number(currArr[i])) break;
      }
    }

    return false;
  };
}
