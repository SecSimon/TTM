import { Component, OnInit } from '@angular/core';
import { IUserInfo, ProjectFile } from '../../../model/project-file';
import { DataService, IGHCommitInfo, IGHFile } from '../../../util/data.service';
import { StringExtension } from '../../../util/string-extension';
import { ThemeService } from '../../../util/theme.service';

@Component({
  selector: 'app-model-info',
  templateUrl: './model-info.component.html',
  styleUrls: ['./model-info.component.scss']
})
export class ModelInfoComponent implements OnInit {

  public GHProject: IGHFile;
  public Project: ProjectFile;

  public isEdtingArray: boolean[][] = [[], []];

  public selectedUser: IUserInfo;

  public commits: IGHCommitInfo[];

  constructor(public dataService: DataService, public theme: ThemeService) { }

  ngOnInit(): void {
    this.GHProject = this.dataService.SelectedGHProject;
    this.Project = this.dataService.Project;

    this.dataService.GetProjectHistory().then(x => this.commits = x);
  }

  public AddUser() {
    this.Project.Participants.push({ Name: StringExtension.FindUniqueName('Participant', this.Project.Participants.map(x => x.Name)), Email: '' });
  }

  public DeleteUser(user: IUserInfo) {
    const index = this.Project.Participants.indexOf(user);
    if (index >= 0) {
      this.Project.Participants.splice(index, 1);
      if (this.selectedUser == user) this.selectedUser = null;
    }
  }
}
