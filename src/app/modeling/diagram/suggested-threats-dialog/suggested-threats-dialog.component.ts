import { Component, OnInit, Optional } from '@angular/core';
import { DFDElement, IElementTypeThreat, StencilThreatMnemonic } from '../../../model/dfd-model';
import { DataService } from '../../../util/data.service';
import { ThreatEngineService } from '../../../util/threat-engine.service';

@Component({
  selector: 'app-suggested-threats-dialog',
  templateUrl: './suggested-threats-dialog.component.html',
  styleUrls: ['./suggested-threats-dialog.component.scss']
})
export class SuggestedThreatsDialogComponent implements OnInit {
  public step = 0;

  public element: DFDElement;
  public mnemonicArray: [StencilThreatMnemonic, IElementTypeThreat[]][] = [];

  constructor(@Optional() element: DFDElement, public dataService: DataService, private threatEngine: ThreatEngineService) {
    this.element = element;

    this.dataService.Config.GetStencilThreatMnemonics().forEach(x => {
      const cats = x.Letters.filter(l => l.AffectedElementTypes.includes(this.element.GetProperty('Type')?.ElementTypeID));
      if (cats.length > 0) this.mnemonicArray.push([x, cats]);
    }); 
  }

  ngOnInit(): void {
  }

  public AddThreat(letter: IElementTypeThreat) {
    this.hasThreatBuffer[letter.ID] = true;
    this.threatEngine.AddMnemonicThreat(this.element, letter).subscribe(res => {
      if (!res) this.hasThreatBuffer[letter.ID] = null;
    });
  }

  private hasThreatBuffer = {};
  public HasThreat(letter: IElementTypeThreat) {
    if (this.hasThreatBuffer[letter.ID] == null) {
      this.hasThreatBuffer[letter.ID] = this.dataService.Project.GetAttackScenarios().filter(x => x.Target == this.element).filter(x => x.ThreatMnemonicLetterID == letter.ID).length > 0;
    }
    return this.hasThreatBuffer[letter.ID];
  }

  public SetStep(index: number) {
    this.step = index;
  }

  public NextStep() {
    this.step++;
  }

  public PrevStep() {
    this.step--;
  }
}
