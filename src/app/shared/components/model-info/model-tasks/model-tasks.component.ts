import { Component, OnInit } from '@angular/core';
import { ProjectFile } from '../../../../model/project-file';
import { DataService } from '../../../../util/data.service';

@Component({
  selector: 'app-model-tasks',
  templateUrl: './model-tasks.component.html',
  styleUrls: ['./model-tasks.component.scss']
})
export class ModelTasksComponent implements OnInit {

  public Project: ProjectFile;

  constructor(public dataService: DataService) { }

  ngOnInit(): void {
    this.Project = this.dataService.Project;
  }

}
