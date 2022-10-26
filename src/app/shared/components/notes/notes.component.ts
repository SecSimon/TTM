import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit, Optional } from '@angular/core';
import { INote } from '../../../model/database';
import { DataService } from '../../../util/data.service';
import { NoteConfig } from '../../../util/dialog.service';
import { ThemeService } from '../../../util/theme.service';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class NotesComponent implements OnInit {
  private _notes: INote[];
  private _strings: string[];

  public get notes(): INote[] { return this._notes; }
  @Input() 
  public set notes(val: INote[]) {
    this._notes = val;
    this._strings = val?.map(x => x.Note);
  }
  public get strings(): string[] { return this._strings; }
  @Input() 
  public set strings(val: string[]) {
    this._strings = val;
    this._notes = [];
    val?.forEach(x => {
      this._notes.push({ Author: '', Date: '', ShowTimestamp: this.showTimestamp, HasCheckbox: this.hasCheckbox, IsChecked: false, Note: x });
    });
  } 
  @Input() public showTimestamp: boolean = true;
  @Input() public hasCheckbox: boolean = false;
  @Input() public canToggleCheckbox: boolean = false;
  @Input() public canToggleTimestamp: boolean = false;

  public isEdtingArray: boolean[][] = [[], []];

  constructor(@Optional() cfg: NoteConfig, public theme: ThemeService, public dataService: DataService) {
    if (cfg) {
      this.showTimestamp = cfg.ShowTimestamp;
      this.hasCheckbox = cfg.HasCheckbox;
      this.canToggleCheckbox = cfg.CanToggleCheckbox;
      this.canToggleTimestamp = cfg.CanToggleTimestamp;
      this.notes = cfg.Notes;
    }
  }

  ngOnInit(): void {
  }

  public OnDeleteItem(item: any) {
    const index = this.notes.indexOf(item);
    if (index >= 0) {
      this.notes.splice(index, 1);
      this.strings.splice(index, 1);
    }
  }

  public OnRenameItem(event, arr: number, index: number) {
    if (event.key === 'Enter' || event.type === 'focusout') {
      this.notes[index]['Note'] = event.target['value'];
      this.strings[index] = event.target['value'];
      this.isEdtingArray[arr][index] = false;
    }
  }

  public OnKeyDown(event: KeyboardEvent) {
    if (event.key == 'Enter') {
      this.notes.push({
        Date: Date.now().toString(), Author: this.dataService.UserDisplayName, Note: event.target['value'],
        ShowTimestamp: this.showTimestamp,
        HasCheckbox: this.hasCheckbox,
        IsChecked: false
      });
      this.strings.push(event.target['value']);
      event.target['value'] = '';
    }
  }

  public drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.notes, event.previousIndex, event.currentIndex);
    moveItemInArray(this.strings, event.previousIndex, event.currentIndex);
  }
}
