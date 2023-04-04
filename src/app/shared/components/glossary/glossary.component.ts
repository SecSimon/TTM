import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../../util/theme.service';
import { DialogService } from '../../../util/dialog.service';

interface IGlossaryEntry {
  name: string;
  description: string;
}

const glossaryKeys: string[] = [
  'Asset',
  'AttackScenario',
  'AttackVector',
  'Countermeasure',
  'IoT-Device',
  'Mitigation',
  'MitigationProcess',
  'Risk',
  'RiskAssessment',
  'SystemThreat',
  'Threat',
  'ThreatAnalysis',
  'ThreatModeling',
  'ThreatSource',
  'Vulnerability',
  'Weakness'
]

@Component({
  selector: 'app-glossary',
  templateUrl: './glossary.component.html',
  styleUrls: ['./glossary.component.scss']
})
export class GlossaryComponent implements OnInit {

  public alphabet: string[] = [];
  public glossary = {};
  public termsImageSrc = './assets/Terms_en.png';
  @ViewChild('termsImg') public termsImage: ElementRef;

  constructor(public theme: ThemeService, private dialog: DialogService, private translate: TranslateService) { }

  ngOnInit(): void {
    for (let i = 0; i < 26; i++) { this.alphabet.push(String.fromCharCode('A'.charCodeAt(0)+i)); }

    glossaryKeys.forEach(item => {
      const entry: IGlossaryEntry = { name: this.translate.instant('glossary.' + item + '.n'), description: this.translate.instant('glossary.' + item + '.d') };
      if (this.glossary[entry.name[0]] == null) this.glossary[entry.name[0]] = [];
      this.glossary[entry.name[0]].push(entry);
    });

    if (this.translate.currentLang === 'de') this.termsImageSrc = this.termsImageSrc.replace('_en', '_de');
  }

  public ScrollTo(letter: string) {
    const letters = Array.from(document.getElementsByTagName('h3'));
    const element = letters.find(x => x.textContent == letter);
    if (element) {
      element.scrollIntoView();
    }
  }

  public ViewImage() {
    this.dialog.OpenViewImageDialog(this.termsImage.nativeElement.src, '1200px');
  }
}
