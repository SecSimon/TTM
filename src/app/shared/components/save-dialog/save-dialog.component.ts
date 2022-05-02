import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroupDirective, NgForm, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IKeyValue } from '../../../model/database';
import { DataService, IGHFile } from '../../../util/data.service';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

export function forbiddenNameValidator(existing: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    let forbidden = existing.includes(control.value + '.ttmp');
    if (!forbidden) forbidden = existing.includes(control.value + '.ttmc');
    return forbidden ? {forbiddenName: {value: control.value}} : null;
  };
}

@Component({
  selector: 'app-save-dialog',
  templateUrl: './save-dialog.component.html',
  styleUrls: ['./save-dialog.component.scss']
})
export class SaveDialogComponent implements OnInit {

  public nameFormControl = new FormControl('', [Validators.required, forbiddenNameValidator([...this.dataService.AvailableGHProjects.map(x => x.name), ...this.dataService.AvailableGHConfigs.map(x => x.name)])]); // ToDo filter for repo
  public matcher = new MyErrorStateMatcher();

  public show: boolean = false;

  public get canSave(): boolean {
    if ('newProject' in this.data) {
      if (this.data['newProject']['repoId'] == null) return false;
      if (this.nameFormControl.hasError('required') || this.nameFormControl.hasError('forbiddenName')) return false; 
    }
    if ('newConfig' in this.data) {
      if (this.data['newConfig']['repoId'] == null) return false;
      if (this.nameFormControl.hasError('required') || this.nameFormControl.hasError('forbiddenName')) return false; 
    }
    return true;
  }

  private configs: IKeyValue[];
  public get Configs(): IKeyValue[] {
    if (!this.configs) {
      this.configs = [ { Key: null, Value: 'Default Configuration' } ];
      this.dataService.AvailableGHConfigs.forEach(x => {
        this.configs.push({ Key: x, Value: x.name });
      });
    }
    return this.configs;
  }

  public get Repos() {
    return this.dataService.Repos.filter(x => x.isWritable);
  }

  constructor(public dialogRef: MatDialogRef<SaveDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: {}, public dataService: DataService) { }

  ngOnInit(): void {
  }

  public onSave() {
    if ('newProject' in this.data) {
      (this.data['newProject'] as IGHFile).name = this.nameFormControl.value + '.ttmp';
      (this.data['newProject'] as IGHFile).path = 'projects/' + this.nameFormControl.value + '.ttmp';
    }
    else if ('newConfig' in this.data) {
      (this.data['newConfig'] as IGHFile).name = this.nameFormControl.value + '.ttmc';
      (this.data['newConfig'] as IGHFile).path = 'configs/' + this.nameFormControl.value + '.ttmc';
    }
  }
}
