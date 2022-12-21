import { Component, Input, OnInit, Optional } from '@angular/core';
import { ICVSSEntry } from '../../../model/threat-model';

import Cvss from 'cvss-calculator';
import { DataService } from '../../../util/data.service';
import { MyCVSSEntry } from '../../../util/dialog.service';

@Component({
  selector: 'app-cvss-entry',
  templateUrl: './cvss-entry.component.html',
  styleUrls: ['./cvss-entry.component.scss']
})
export class CvssEntryComponent implements OnInit {
  @Input() public entry: ICVSSEntry;

  public get Score(): number {
    return this.entry.Score;
  }
  public set Score(val: number) { this.entry.Score = val; }

  constructor(@Optional() public data: MyCVSSEntry, public dataService: DataService) {
    if (data) this.entry = data.Value;
  }

  ngOnInit(): void {
    if (!this.Score) this.CalcScore();
  }

  public OpenCVSS() {
    const link = CvssEntryComponent.GetURL(this.entry);
    if (link) window.open(link, '_blank');
  }

  public CalcScore() {
    let vec = CvssEntryComponent.GetVector(this.entry);
    if (vec && vec.length > 8) {
      const cvss = new Cvss(vec);
      this.Score = cvss.getBaseScore();
    }
  }

  public static GetURL(entry: ICVSSEntry) {
    let vec = CvssEntryComponent.GetVector(entry);
    if (vec) return 'https://www.first.org/cvss/calculator/3.1#' + vec;
    return null;
  }

  public static GetVector(entry: ICVSSEntry) {
    if (entry) {
      let vec = 'CVSS:3.1';
      Object.keys(entry).forEach(k => {
        if (entry[k] && typeof entry[k] === 'string') vec += '/' + k + ':' + entry[k];
      });
      return vec;
    }

    return null;
  }
}
