import { Color, NgxMatColorPickerComponent } from '@angular-material-components/color-picker';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, AbstractControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { Observable, startWith, map } from 'rxjs';
import { MyTag, ITagable } from '../../../model/my-tags';
import { DataService } from '../../../util/data.service';
import { DialogService } from '../../../util/dialog.service';

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss']
})
export class TagsComponent implements OnInit {
  separatorKeysCodes: number[] = [ENTER, COMMA];
  tagCtrl = new FormControl('');
  filteredTags: Observable<MyTag[]>;

  @ViewChild('tagInput') public tagInput: ElementRef<HTMLInputElement>;

  public colorCtr: AbstractControl = new FormControl(new Color(255, 243, 0));

  @Input() public tagableElement: ITagable;

  constructor(private dataService: DataService, private dialog: DialogService) {
    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => (tag ? this._filterTag(tag) : this.dataService.Project.GetMyTags().slice())),
    );
  }

  ngOnInit(): void {
  }

  public AddTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      if (this.dataService.Project.GetMyTags().map(x => x.Name).includes(value)) {
        this.tagableElement.AddMyTag(this.dataService.Project.GetMyTags().find(x => x.Name == value));
      }
      else {
        const tag = this.dataService.Project.CreateMyTag();
        tag.Name = value;
        this.tagableElement.AddMyTag(tag);
      }
    }

    // Clear the input value
    event.chipInput!.clear();
    this.tagCtrl.setValue(null);
  }

  public RemoveTag(tag: MyTag): void {
    this.tagableElement.RemoveMyTag(tag.ID);
  }

  public DeleteTag(tag: MyTag, event) {
    this.dialog.OpenDeleteObjectDialog(tag).subscribe(res => {
      if (res) {
        this.dataService.Project.DeleteMyTag(tag);
        // Clear the input value
        this.tagCtrl.setValue(null);
      }
    });
    event.stopPropagation();
  }

  public EditTag(tag: MyTag, event) {
    this.dialog.OpenRenameDialog(tag, tag.GetProperties().find(x => x.ID == 'Name'));
    event.stopPropagation();
  }

  public TagDown(tag: MyTag, event) {
    const tags = this.dataService.Project.GetMyTags();
    const curr = tags.indexOf(tag);
    if (curr != tags.length-1) moveItemInArray(tags, curr, curr+1);
    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => (tag ? this._filterTag(tag) : this.dataService.Project.GetMyTags().slice())),
    );
    event.stopPropagation();
  }

  public TagUp(tag: MyTag, event) {
    const tags = this.dataService.Project.GetMyTags();
    const curr = tags.indexOf(tag);
    if (curr != 0) moveItemInArray(tags, curr, curr-1);
    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => (tag ? this._filterTag(tag) : this.dataService.Project.GetMyTags().slice())),
    );
    event.stopPropagation();
  }

  public SelectedTag(event: MatAutocompleteSelectedEvent): void {
    this.tagableElement.AddMyTag(event.option.value);
    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue(null);
  }

  public OnChipClick(picker: NgxMatColorPickerComponent) {
    picker.open();
  }

  private _filterTag(value): MyTag[] {
    let filterValue = '';
    if (value instanceof MyTag) filterValue = value.Name.toLowerCase();
    else filterValue = value.toLowerCase();

    return this.dataService.Project.GetMyTags().filter(tag => tag.Name.toLowerCase().includes(filterValue));
  }
}
