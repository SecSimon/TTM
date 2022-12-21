import { Component, Input, OnInit } from '@angular/core';

import capecDict from '../../../../assets/capec/mechanisms.json';
import { DataService } from '../../../util/data.service';

@Component({
  selector: 'app-capec-entry',
  templateUrl: './capec-entry.component.html',
  styleUrls: ['./capec-entry.component.scss']
})
export class CapecEntryComponent implements OnInit {

  @Input()
  public capecID: string | number;

  constructor(public dataService: DataService) {
  }

  ngOnInit(): void {
    if (!this.capecID) console.error('Unset capecID');
  }

  public OpenCAPEC() {
    window.open(CapecEntryComponent.GetURL(this.capecID), '_blank');
  }

  public GetCAPECTitle() {
    if (!CapecEntryComponent.GetCAPEDEntry(this.capecID)) return null;
    return 'CAPEC-' + capecDict[this.capecID]['ID'] + ': ' + capecDict[this.capecID]['Name'] + ' (' + capecDict[this.capecID]['Status'] + ')'
  }

  public GetCAPECProperty(prop: string) {
    if (!CapecEntryComponent.GetCAPEDEntry(this.capecID)) return null;
    let res = CapecEntryComponent.GetCAPEDEntry(this.capecID)[prop];
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

  public GetCAPECConsequences(): {}[] {
    if (!CapecEntryComponent.GetCAPEDEntry(this.capecID)) return null;
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

  public static GetCAPEDEntry(id) {
    return capecDict[id];
  }

  public static GetURL(id: string|number): string {
    return 'https://capec.mitre.org/data/definitions/' + id.toString() +'.html';
  }
}
