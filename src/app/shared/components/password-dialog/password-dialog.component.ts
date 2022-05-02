import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-password-dialog',
  templateUrl: './password-dialog.component.html',
  styleUrls: ['./password-dialog.component.scss']
})
export class PasswordDialogComponent implements OnInit {

  public show: boolean = false;

  constructor(public dialogRef: MatDialogRef<PasswordDialogComponent>, @Inject(MAT_DIALOG_DATA) public pw: {}) { }

  ngOnInit(): void {
  }

}
