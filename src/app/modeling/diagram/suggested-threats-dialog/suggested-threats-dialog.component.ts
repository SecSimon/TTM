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

  constructor(@Optional() element: DFDElement, private dataService: DataService, private threatEngine: ThreatEngineService) {
    this.element = element;

    this.dataService.Config.GetStencilThreatMnemonics().forEach(x => {
      const cats = x.Letters.filter(l => l.AffectedElementTypes.includes(this.element.Type.ElementTypeID));
      if (cats.length > 0) this.mnemonicArray.push([x, cats]);
    }); 
  }

  ngOnInit(): void {
  }

  public AddThreat(letter: IElementTypeThreat) {
    this.hasThreatBuffer[letter.Name] = true;
    this.threatEngine.AddMnemonicThreat(this.element, letter).subscribe(res => {
      if (!res) this.hasThreatBuffer[letter.Name] = null;
    });
  }

  private hasThreatBuffer = {};
  public HasThreat(letter: IElementTypeThreat) {
    if (this.hasThreatBuffer[letter.Name] == null) {
      this.hasThreatBuffer[letter.Name] = this.dataService.Project.GetThreatMappings().filter(x => x.Target == this.element).filter(x => x.ThreatCategories.includes(this.dataService.Config.GetThreatCategory(letter.threatCategoryID))).length > 0;
    }
    return this.hasThreatBuffer[letter.Name];
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
