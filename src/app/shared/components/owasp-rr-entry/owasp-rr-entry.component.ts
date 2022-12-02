import { Component, Input, OnInit, Optional } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LowMediumHighNumber, LowMediumHighNumberUtil } from '../../../model/assets';
import { IOwaspRREntry, ThreatSeverities, ThreatSeverityUtil } from '../../../model/threat-model';
import { DataService } from '../../../util/data.service';
import { MyOwaspRREntry } from '../../../util/dialog.service';

@Component({
  selector: 'app-owasp-rr-entry',
  templateUrl: './owasp-rr-entry.component.html',
  styleUrls: ['./owasp-rr-entry.component.scss']
})
export class OwaspRREntryComponent implements OnInit {
  
  @Input() public entry: IOwaspRREntry;

  constructor(@Optional() public data: MyOwaspRREntry, public dataService: DataService, private translate: TranslateService) {
    if (data) this.entry = data.Value;
  }

  ngOnInit(): void {
    this.GetLabelOverallRisk(); // init value
  }

  public OpenCalculator() {
    let vec = this.GetVector();
    if (vec) window.open(this.GetURL(), '_blank');
  }

  public GetFactorThreatAgent() {
    return this.getFactor([this.entry.SL, this.entry.M, this.entry.O, this.entry.S]);
  }

  public GetFactorVulnerability() {
    return this.getFactor([this.entry.ED, this.entry.EE, this.entry.A, this.entry.ID]);
  }

  public GetFactorTechnicalImpact() {
    return this.getFactor([this.entry.LC, this.entry.LI, this.entry.LAV, this.entry.LAC]);
  }

  public GetFactorBusinessImpact() {
    return this.getFactor([this.entry.FD, this.entry.RD, this.entry.NC, this.entry.PV]);
  }

  public GetFactorLikelihood() {
    return this.getFactor([this.GetFactorThreatAgent(), this.GetFactorVulnerability()]);
  }

  public GetFactorImpact() {
    return this.getFactor([this.GetFactorTechnicalImpact(), this.GetFactorBusinessImpact()]);
  }

  public GetLabelThreatAgent() {
    return this.getFactorCategoryString(this.GetFactorThreatAgent());
  }

  public GetLabelVulnerability() {
    return this.getFactorCategoryString(this.GetFactorVulnerability());
  }

  public GetLabelTechnicalImpact() {
    return this.getFactorCategoryString(this.GetFactorTechnicalImpact());
  }

  public GetLabelBusinessImpact() {
    return this.getFactorCategoryString(this.GetFactorBusinessImpact());
  }

  public GetLabelLikelihood() {
    return this.getFactorCategoryString(this.GetFactorLikelihood());
  }

  public GetLabelImpact() {
    return this.getFactorCategoryString(this.GetFactorImpact());
  }

  public GetLabelOverallRisk() {
    const vals = [this.getFactorCategory(this.GetFactorImpact()), this.getFactorCategory(this.GetFactorLikelihood())];
    let res: ThreatSeverities = ThreatSeverities.None;
    if (vals.every(x => x == LowMediumHighNumber.High)) res = ThreatSeverities.Critical;
    else if (vals.some(x => x == LowMediumHighNumber.High) && vals.some(x => x == LowMediumHighNumber.Medium)) res = ThreatSeverities.High;
    else if (vals.every(x => x == LowMediumHighNumber.Medium) || vals.some(x => x == LowMediumHighNumber.High)) res = ThreatSeverities.Medium;
    else if (vals.some(x => x == LowMediumHighNumber.Medium)) res = ThreatSeverities.Low;

    if (res != this.entry.Score) {
      setTimeout(() => {
        this.entry.Impact = this.getFactorCategory(this.GetFactorImpact());
        this.entry.Likelihood = this.getFactorCategory(this.GetFactorLikelihood())
        this.entry.Score = res;
      }, 10);
    }

    return this.translate.instant(ThreatSeverityUtil.ToString(res));
  }

  private getFactor(vals: number[]) {
    let factor = 0;
    vals.filter(x => x).forEach(x => factor += x);
    return factor / vals.length;
  }

  private getFactorCategory(factor: number): LowMediumHighNumber {
    let cat = LowMediumHighNumber.Low;
    if (factor >= 3 && factor < 6) cat = LowMediumHighNumber.Medium;
    else if (factor >= 6) cat = LowMediumHighNumber.High;
    return cat;
  }

  private getFactorCategoryString(factor: number) {
    if (factor == 0) return '';
    return this.translate.instant(LowMediumHighNumberUtil.ToString(this.getFactorCategory(factor))) + ' (' + factor.toFixed(2) + ')';
  }

  public GetURL() {
    return 'https://owasp-risk-rating.com/?vector=(' + this.GetVector() + ')';
  }

  public GetVector(): string {
    if (this.entry) {
      let vec = '';
      Object.keys(this.entry).forEach(k => {
        if (this.entry[k] && k.length <= 3) vec += '/' + k + ':' + this.entry[k];
      });
      return vec;
    }

    return null;
  }
}
