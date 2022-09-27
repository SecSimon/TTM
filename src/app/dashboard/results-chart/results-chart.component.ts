import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { LegendPosition } from '@swimlane/ngx-charts';
import { ThemeService } from '../../util/theme.service';

import { IDiagramData } from '../results-analysis/results-analysis.component';

@Component({
  selector: 'app-results-chart',
  templateUrl: './results-chart.component.html',
  styleUrls: ['./results-chart.component.scss']
})
export class ResultsChartComponent implements OnInit {

  @Input()
  public diagram: IDiagramData;
  public legendPosition: LegendPosition = LegendPosition.Below;

  constructor(public theme: ThemeService, public elRef: ElementRef) { }

  ngOnInit(): void {
  }

  public CutDigits(val: number) {
    return val.toFixed(0);
  }
}
