import { Component, Input, OnInit } from '@angular/core';
import { ElementTypeIDs, ElementTypeUtil, StencilType, StencilTypeTemplate } from '../../../model/dfd-model';
import { DataService } from '../../../util/data.service';

@Component({
  selector: 'app-stencil-type-template',
  templateUrl: './stencil-type-template.component.html',
  styleUrls: ['./stencil-type-template.component.scss']
})
export class StencilTypeTemplateComponent implements OnInit {

  @Input()
  public selectedTypeTemplate: StencilTypeTemplate;

  constructor(public dataService: DataService) { }

  ngOnInit(): void {
  }

  public GetElementTypes() {
    let res: ElementTypeIDs[] = [];
    if (this.selectedTypeTemplate.ListInHWDiagram) res.push(...[ElementTypeIDs.PhyProcessing, ElementTypeIDs.PhyDataStore, ElementTypeIDs.PhyExternalEntity, ElementTypeIDs.PhyTrustArea, ElementTypeIDs.PhysicalLink, ElementTypeIDs.Interface]);
    if (this.selectedTypeTemplate.ListInUCDiagram) res.push(...[ElementTypeIDs.LogProcessing, ElementTypeIDs.LogDataStore, ElementTypeIDs.LogExternalEntity, ElementTypeIDs.PhyExternalEntity, ElementTypeIDs.LogTrustArea, ElementTypeIDs.PhyTrustArea, ElementTypeIDs.PhysicalLink]);
    return res;
  }

  public GetElementTypeName(type: ElementTypeIDs): string {
    return ElementTypeUtil.ToString(type);
  }

  public GetStencilTypes(): StencilType[] {
    let res = this.dataService.Config.GetStencilTypes();
    res.sort((a, b) => {
      const def = b.IsDefault;
      if (def) return 1;
      return a.ElementTypeID - b.ElementTypeID;
    });
    return res;
  }

  public AutoCalcLayout() {
    if (this.selectedTypeTemplate && this.selectedTypeTemplate.StencilTypes?.length > 0) {
      let stencils = this.selectedTypeTemplate.StencilTypes;
      let layouts = this.selectedTypeTemplate.Layout;
      let entities = stencils.filter(x => x.ElementTypeID != ElementTypeIDs.PhyTrustArea && x.ElementTypeID != ElementTypeIDs.LogTrustArea);

      let calcCols = (cnt): number => {
        if (cnt <= 4) return 2;
        if (cnt <= 9) return 3;
        return 4;
      };
      let calcRows = (cnt, cols): number => {
        return Math.ceil(cnt/cols);
      };

      const marginX = 20, marginY = 40;
      const offset = 20;
      const wid = 140;
      const hei = 75;
      let cols = calcCols(entities.length);
      let rows = calcRows(entities.length, cols);
      for (let i = 0, row = 0, col = 0; i < stencils.length; i++) {
        if (stencils[i].ElementTypeID != ElementTypeIDs.PhyTrustArea && stencils[i].ElementTypeID != ElementTypeIDs.LogTrustArea) {
          layouts[i].x = marginX + col * (wid+offset);
          layouts[i].y = marginY + row * (hei+offset);
          col++;
          if (col == cols) {
            col = 0;
            row++;
          }
        }
        else {
          // TA
          layouts[i].x = layouts[i].y = 0;
          layouts[i].width = 2 * marginX + cols * wid + (cols-1) * offset;
          layouts[i].height = 2 * marginY + rows * hei + (rows-1) * offset;
        }
      }
    }
  }
}
