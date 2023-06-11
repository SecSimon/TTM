import { Component, Input, OnInit, Optional } from '@angular/core';
import { ICVSSEntry, ThreatSeverities } from '../../../model/threat-model';
import { Clipboard } from '@angular/cdk/clipboard';

import Cvss from 'cvss-calculator';
import { DataService } from '../../../util/data.service';
import { DialogService, MyCVSSEntry } from '../../../util/dialog.service';

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

  public get Vector(): string {
    return CvssEntryComponent.GetVector(this.entry);
  }
  public set Vector(val: string) {
    this.SetVector(val);
  }

  constructor(@Optional() public data: MyCVSSEntry, public dataService: DataService, private dialog: DialogService, private clipboard: Clipboard) {
    if (data) this.entry = data.Value;
  }

  ngOnInit(): void {
    if (!this.Score) this.CalcScore();
    if (!this.entry?.Notes) this.entry.Notes = {};
  }

  public CopyVector() {
    this.clipboard.copy(this.Vector);
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

  public SetVector(val: string) {
    if (val) {
      let valid = true;
      const validMetrics = ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A', 'CVSS'];
      const removeMetric = (metric: string) => {
        const index = validMetrics.indexOf(metric);
        if (index >= 0) validMetrics.splice(index, 1);
      };

      const res = {};
      const metrics = val.split('/');
      metrics.forEach(metric => {
        if (valid) {
          const parts = metric.split(':');
          if (parts.length == 2) {
            if (validMetrics.includes(parts[0])) {
              switch (parts[0]) {
                case 'AV':
                  if (['N', 'A', 'L', 'P'].includes(parts[1])) { res[parts[0]] = parts[1]; removeMetric(parts[0]); }
                  else valid = false;
                  break;
                case 'AC':
                  if (['L', 'H'].includes(parts[1])) { res[parts[0]] = parts[1]; removeMetric(parts[0]); }
                  else valid = false;
                  break;
                case 'PR':
                  if (['N', 'L', 'H'].includes(parts[1])) { res[parts[0]] = parts[1]; removeMetric(parts[0]); }
                  else valid = false;
                  break;
                case 'UI':
                  if (['N', 'R'].includes(parts[1])) { res[parts[0]] = parts[1]; removeMetric(parts[0]); }
                  else valid = false;
                  break;
                case 'S':
                  if (['U', 'C'].includes(parts[1])) { res[parts[0]] = parts[1]; removeMetric(parts[0]); }
                  else valid = false;
                  break;
                case 'C':
                  if (['N', 'L', 'H'].includes(parts[1])) { res[parts[0]] = parts[1]; removeMetric(parts[0]); }
                  else valid = false;
                  break;
                case 'I':
                  if (['N', 'L', 'H'].includes(parts[1])) { res[parts[0]] = parts[1]; removeMetric(parts[0]); }
                  else valid = false;
                  break;
                case 'A':
                  if (['N', 'L', 'H'].includes(parts[1])) { res[parts[0]] = parts[1]; removeMetric(parts[0]); }
                  else valid = false;
                  break;
                case 'CVSS':
                  if (['2.0', '3.0', '3.1'].includes(parts[1])) { res['Version'] = parts[1]; removeMetric(parts[0]); }
                  else valid = false;
                  break;
              
                default:
                  valid = false;
                  break;
              }
            }
            else {
              valid = false;
            }
          }
          else {
            valid = false;
          }
        }
      });

      if (valid) {
        Object.keys(res).forEach(key => {
          this.entry[key] = res[key];
        });
        this.CalcScore();
      }
    }
  }

  public OpenNotes(metric: string) {
    if (this.entry.Notes[metric] == null) this.entry.Notes[metric] = [];
    const notes = this.entry.Notes[metric];
    this.dialog.OpenNotesDialog(notes, true, false, true, true);
  }

  public GetNotesCountOfMetric(metric: string): number {
    if (this.entry.Notes[metric]) {
      return this.entry.Notes[metric].length;
    }
    return 0;
  }

  public static ToThreatSeverity(score: number) {
    if (score >= 9) return ThreatSeverities.Critical;
    else if (score >= 7) return ThreatSeverities.High;
    else if (score >= 4) return ThreatSeverities.Medium;
    else if (score > 0) return ThreatSeverities.Low;
    else return ThreatSeverities.None;
  }

  public static GetURL(entry: ICVSSEntry) {
    let vec = CvssEntryComponent.GetVector(entry);
    const version = entry.Version ? entry.Version : '3.1';
    if (vec) return 'https://nvd.nist.gov/vuln-metrics/cvss/v' + version[0] + '-calculator?vector=' + vec.substring(vec.indexOf('/')+1) + '&version=' + version;
    return null;
  }

  public static GetVector(entry: ICVSSEntry) {
    if (entry) {
      let vec = 'CVSS:' + (entry.Version ? entry.Version : '3.1');
      if (entry.Vector) return entry.Vector.includes('CVSS') ? entry.Vector : (vec + '/' + entry.Vector);
      const order = ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'];
      order.forEach(key => {
        if (entry[key] && entry[key].length > 0) vec += '/' + key + ':' + entry[key];
      });
      return vec;
    }

    return null;
  }
}
