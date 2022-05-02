import { Component, Input, OnInit } from '@angular/core';

import capecDict from '../../../../assets/capec/mechanisms.json';

@Component({
  selector: 'app-capec-entry',
  templateUrl: './capec-entry.component.html',
  styleUrls: ['./capec-entry.component.scss']
})
export class CapecEntryComponent implements OnInit {

  @Input()
  public capecID: string | number;

  constructor() {
  }

  ngOnInit(): void {
    if (!this.capecID) console.error('Unset capecID');
  }

  public OpenCAPEC() {
    window.open('https://capec.mitre.org/data/definitions/' + this.capecID.toString() +'.html', '_blank');
  }

  public GetCAPECTitle() {
    if (!this.GetCAPEDEntry()) return null;
    return 'CAPEC-' + capecDict[this.capecID]['ID'] + ': ' + capecDict[this.capecID]['Name'] + ' (' + capecDict[this.capecID]['Status'] + ')'
  }

  public GetCAPECProperty(prop: string) {
    if (!this.GetCAPEDEntry()) return null;
    let res = this.GetCAPEDEntry()[prop];
    if (res == null) return '';
    if (typeof res === 'object' && res !== null) {
      if (res['p'] != null) {
        if(Object.prototype.toString.call(res['p']) === '[object Array]') {
          return res['p'].join('\n');
        }
        else {
          return res['p'];
        }
      }
    }
    return res;
  }

  public GetCAPEDEntry() {
    return capecDict[this.capecID];
  }

  public GetCAPECConsequences(): {}[] {
    if (!this.GetCAPEDEntry()) return null;
    if (capecDict[this.capecID]['Common_Consequences']) {
      if (Array.isArray(capecDict[this.capecID]['Common_Consequences']['Consequence'])) {
        return capecDict[this.capecID]['Common_Consequences']['Consequence'];
      }
      else {
        return [capecDict[this.capecID]['Common_Consequences']['Consequence']];
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
