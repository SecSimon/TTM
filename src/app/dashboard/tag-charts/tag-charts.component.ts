import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { MyTag, MyTagChart, TagChartTypes, TagChartTypeUtil } from '../../model/my-tags';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-tag-charts',
  templateUrl: './tag-charts.component.html',
  styleUrls: ['./tag-charts.component.scss']
})
export class TagChartsComponent implements OnInit {

  public get charts(): MyTagChart[] { return this.dataService.Project.GetMyTagCharts(); }

  public selectedChart: MyTagChart;

  constructor(public theme: ThemeService, public dataService: DataService, private dialog: DialogService) { }

  ngOnInit(): void {
  }

  public AddChart() {
    this.selectedChart = this.dataService.Project.CreateMyTagChart();
  }

  public DeleteChart(chart: MyTagChart) {
    this.dialog.OpenDeleteObjectDialog(chart).subscribe(res => {
      if (res) {
        if (chart == this.selectedChart) this.selectedChart = null;
        this.dataService.Project.DeleteMyTagChart(chart);
      }
    });
  }

  public AddTagToChart(tag) {
    this.selectedChart.AddMyTag(tag);
  }

  public RemoveTag(tag) {
    this.selectedChart.RemoveMyTag(tag.ID);
  }

  public GetPossibleTags() {
    return this.dataService.Project.GetMyTags().filter(x => !this.selectedChart.MyTags.includes(x));
  }
  
  public dropChart(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.dataService.Project.GetMyTagCharts(), event.previousIndex, event.currentIndex);
  }
  
  public dropTag(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.selectedChart.Data['myTagIDs'], event.previousIndex, event.currentIndex);
  }

  public GetTypes() {
    return TagChartTypeUtil.GetKeys();
  }

  public GetTypeName(type: TagChartTypes) {
    return TagChartTypeUtil.ToString(type);
  }
}
