import { Component, OnInit } from '@angular/core';
import { IUserInfo, ProjectFile } from '../../../model/project-file';
import { DataService, IGHCommitInfo, IGHFile } from '../../../util/data.service';
import { StringExtension } from '../../../util/string-extension';
import { ThemeService } from '../../../util/theme.service';

import imageCompression from 'browser-image-compression';

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

    this.dataService.GetGHProjectHistory().then(x => this.commits = x);
  }

  public async OnFileSelected(event) {
    if (event.target.files && event.target.files[0]) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 700,
        useWebWorker: true
      }

      try {
        const compressedFile = await imageCompression(event.target.files[0], options);
        
        let reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onload = (event) => {
          this.Project.Image = event.target.result.toString();
        }
      } 
      catch (error) {
        console.log(error);
      }
    }
  }

  public AddUser() {
    this.Project.Participants.push({ Name: StringExtension.FindUniqueName('Participant', this.Project.Participants.map(x => x.Name)), Email: '' });
    this.selectedUser = this.Project.Participants[this.Project.Participants.length-1];
  }

  public DeleteUser(user: IUserInfo) {
    const index = this.Project.Participants.indexOf(user);
    if (index >= 0) {
      this.Project.Participants.splice(index, 1);
      if (this.selectedUser == user) this.selectedUser = null;
    }
  }

  public GetRemoveBtnLeft(projImg) {
    if (!projImg || projImg['width'] < 25) return '25px';
    return (projImg['width'] - 25).toString() + 'px';
  }
}
