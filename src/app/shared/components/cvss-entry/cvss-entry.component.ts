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
    let vec = this.getVector();
    if (vec) window.open('https://www.first.org/cvss/calculator/3.1#' + vec, '_blank');
  }

  public CalcScore() {
    let vec = this.getVector();
    if (vec && vec.length > 8) {
      const cvss = new Cvss(vec);
      this.Score = cvss.getBaseScore();
    }
  }

  private getVector(): string {
    if (this.entry) {
      let vec = 'CVSS:3.1';
      Object.keys(this.entry).forEach(k => {
        if (this.entry[k] && typeof this.entry[k] === 'string') vec += '/' + k + ':' + this.entry[k];
      });
      return vec;
    }

    return null;
  }
}
