import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { IUserInfo, ProjectFile } from '../../../model/project-file';
import { DataService, IGHFile } from '../../../util/data.service';
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

  constructor(private dataService: DataService, public theme: ThemeService) { }

  ngOnInit(): void {
    this.GHProject = this.dataService.SelectedGHProject;
    this.Project = this.dataService.Project;
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

  public OnDeleteItem(item: any, selectedArray: any[]) {
    const index = selectedArray.indexOf(item);
    if (index >= 0) selectedArray.splice(index, 1);
  }

  public OnRenameItem(event, items: any[], arr: number, index: number, key: string) {
    if (event.key === 'Enter' || event.type === 'focusout') {
      items[index][key] = event.target['value'];
      this.isEdtingArray[arr][index] = false;
    }
  }

  public OnTaskKeyDown(event: KeyboardEvent) {
    if (event.key == 'Enter') {
      this.Project.Tasks.push({ Task: event.target['value'], IsDone: false });
      event.target['value'] = '';
    }
  }

  public OnNoteKeyDown(event: KeyboardEvent) {
    if (event.key == 'Enter') {
      this.Project.Notes.push({ Date: Date.now().toString(), Author: this.dataService.UserDisplayName, Note: event.target['value'] });
      event.target['value'] = '';
    }
  }

  public drop(event: CdkDragDrop<string[]>, selectedArray) {
    moveItemInArray(selectedArray, event.previousIndex, event.currentIndex);
  }
}
