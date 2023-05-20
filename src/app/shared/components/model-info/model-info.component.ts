import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { IUserInfo, ProjectFile } from '../../../model/project-file';
import { DataService, IGHCommitInfo, IGHFile } from '../../../util/data.service';
import { StringExtension } from '../../../util/string-extension';
import { ThemeService } from '../../../util/theme.service';

import imageCompression from 'browser-image-compression';
import { DialogService } from '../../../util/dialog.service';
import { LocStorageKeys, LocalStorageService } from '../../../util/local-storage.service';

@Component({
  selector: 'app-model-info',
  templateUrl: './model-info.component.html',
  styleUrls: ['./model-info.component.scss']
})
export class ModelInfoComponent implements OnInit {

  public GHProject: IGHFile;
  public Project: ProjectFile;

  public selectedUser: IUserInfo;
  public commits: IGHCommitInfo[];


  @Output() public refreshNodes = new EventEmitter();

  constructor(public dataService: DataService, public theme: ThemeService, private dialog: DialogService, private locStorage: LocalStorageService) { }

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

  public ViewImage(img) {
    this.dialog.OpenViewImageDialog(img);
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

  public OnTestingChanged(event) {
    if (event.checked) {
      this.Project.CreateTesting();
      this.refreshNodes.emit();
    }
    else {
      this.dialog.OpenDeleteObjectDialog(this.Project.GetTesting()).subscribe(res => {
        if (res) {
          this.Project.DeleteTesting();
          this.refreshNodes.emit();
        }
        else {
          event.source.checked = true;
        }
      })
    }
  }

  public GetRemoveBtnLeft(projImg) {
    if (!projImg || projImg['width'] < 25) return '25px';
    return (projImg['width'] - 25).toString() + 'px';
  }

  public GetProgress() {
    if (this.dataService.Project) {
      let vals = Object.values(this.dataService.Project.ProgressTracker);
      if (vals.length == 0) return '0%';
      
      return  (100 * vals.filter(x => x == true).length / vals.length).toFixed(0) + '%';
    }
  }

  public GetSelectedTabIndex() {
    let index = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_MODEL_TAB_INDEX);
    if (index != null) return index;
    else return 0;
  }

  public SetSelectedTabIndex(event) {
    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_MODEL_TAB_INDEX, event);
  }
}
