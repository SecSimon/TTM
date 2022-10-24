import { Component, Input, OnInit } from '@angular/core';

import cweDict from 'cwe-sdk/raw/cwe-dictionary.json';
import { DataService } from '../../../util/data.service';

@Component({
  selector: 'app-cwe-entry',
  templateUrl: './cwe-entry.component.html',
  styleUrls: ['./cwe-entry.component.scss']
})
export class CweEntryComponent implements OnInit {

  @Input()
  public cweID: string | number;

  constructor(public dataService: DataService) {
  }

  ngOnInit(): void {
    if (!this.cweID) console.error('Unset cweID');
  }

  public OpenCWE() {
    window.open('https://cwe.mitre.org/data/definitions/' + this.cweID.toString() +'.html', '_blank');
  }

  public GetCWETitle() {
    if (!this.GetCWEEntry()) return null;
    return 'CWE-' + cweDict[this.cweID]['attr']['@_ID'] + ': ' + cweDict[this.cweID]['attr']['@_Name'] + ' (' + cweDict[this.cweID]['attr']['@_Status'] + ')'
  }

  public GetCWEProperty(prop: string) {
    if (!this.GetCWEEntry()) return null;
    return this.GetCWEEntry()[prop] ? this.GetCWEEntry()[prop] : '';
  }

  public GetCWEEntry() {
    return cweDict[this.cweID];
  }

  public GetCWEConsequences(): {}[] {
    if (!this.GetCWEEntry()) return null;
    if (cweDict[this.cweID]['Common_Consequences']) {
      if (Array.isArray(cweDict[this.cweID]['Common_Consequences']['Consequence'])) {
        return cweDict[this.cweID]['Common_Consequences']['Consequence'];
      }
      else {
        return [cweDict[this.cweID]['Common_Consequences']['Consequence']];
      }
    }
    return null;
  }

  public GetValues(obj, inline: boolean): string {
    if (Array.isArray(obj)) {
      if (inline) return (obj as string[]).join('; '); 
      return (obj as string[]).join('\n');
    }
    else return obj;
  }
}
