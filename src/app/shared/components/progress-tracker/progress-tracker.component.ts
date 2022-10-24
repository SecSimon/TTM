import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../util/data.service';
import { ITTMActivity, ITTMStage, ITTMStep, TTMService } from '../../../util/ttm.service';

@Component({
  selector: 'app-progress-tracker',
  templateUrl: './progress-tracker.component.html',
  styleUrls: ['./progress-tracker.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ProgressTrackerComponent implements OnInit {
  private step: number = 0;
  private tracker = {};

  public columnsToDisplay = ['check', 'desc', 'info'];
  expandedActivity: ITTMActivity | null;
  public get Stages(): ITTMStage[] { return this.ttmService.Stages; }

  public get processStep(): number { 
    if (!this.dataService.Project) return this.step;
    if (this.dataService.Project.ProgressStep == null) return 0;
    return this.dataService.Project.ProgressStep; 
  }
  public set processStep(val: number) {
    if (!this.dataService.Project) this.step = val;
    else this.dataService.Project.ProgressStep = val;
  }

  public get Tracker() {
    if (this.dataService.Project) return this.dataService.Project.ProgressTracker;
    return this.tracker;
  }

  constructor(public dataService: DataService, private ttmService: TTMService, private router: Router) { }

  ngOnInit(): void {

    let setSteps = () => {
      if (this.dataService.Project) {
        this.Stages.forEach(stage => {
          stage.steps.forEach(step => {
            step.activities.forEach(act => {
              let k = this.GetActivityKey(stage, step, act);
              if (this.Tracker[k] == null) this.Tracker[k] = false;
            });
          });
        });
      }
    };

    setSteps();
    this.dataService.ProjectChanged.subscribe(x => setSteps());
  }

  public GetCheckedCount(stage: ITTMStage) {
    let keys = Object.keys(this.Tracker).filter(x => x.startsWith(this.Stages.indexOf(stage).toString()));
    let sum = 0;
    keys.forEach(x => {
      if (this.Tracker[x] == true) sum++;
    });
    return sum;
  }

  public GetActivityCount(stage: ITTMStage) {
    return stage.steps.reduce((acts, s) => acts + s.activities.length, 0);
  }

  public GetActivityKey(stage: ITTMStage, step: ITTMStep, act: ITTMActivity) {
    return this.Stages.indexOf(stage) + '.' + stage.steps.indexOf(step) + '.' + step.activities.indexOf(act);
  }

  public OnEntryClick(entry: ITTMActivity) {
    if (entry.desc?.length > 0) this.expandedActivity = this.expandedActivity === entry ? null : entry
  }

  public SetProcessStep(index: number) {
    this.processStep = index;
  }

  public NextProcessStep() {
    this.processStep++;
  }

  public PrevProcessStep() {
    this.processStep--;
  }

  public NavigateTo(link: string) {
    if (!link) return;

    let parts = link.split('?');
    let params = {};
    for (let i = 1; i < parts.length; i++) {
      let param = parts[i].split('=');
      params[param[0]] = param[1];
    }
    this.router.navigate([parts[0]], {
      queryParams: params
    });
  }
}
