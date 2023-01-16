import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatabaseBase, IProperty } from '../../../model/database';

export interface IRenameDialogData {
  Object: DatabaseBase;
  Property: IProperty;
}

@Component({
  selector: 'app-rename-dialog',
  templateUrl: './rename-dialog.component.html',
  styleUrls: ['./rename-dialog.component.scss']
})
export class RenameDialogComponent implements OnInit {

  public get Value(): string {
    return this.data.Object.GetProperty(this.data.Property.ID);
  }
  public set Value(val: string) {
    this.data.Object.SetProperty(this.data.Property.ID, val);
  }

  constructor(public dialogRef: MatDialogRef<RenameDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: IRenameDialogData) { }

  ngOnInit(): void {
  }

}
