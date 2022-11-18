import { Component, Inject, Injector, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IKeyValue } from '../../../model/database';

export interface ITwoOptionDialogData {
  title: string;
  textContent?: string;
  component?: any;
  componentInputData?: IKeyValue[];
  resultTrueText: string;
  hasResultFalse: boolean;
  resultFalseText: string;
  resultTrueEnabled: () => boolean;
  initalTrue: boolean;
  canIterate?: boolean;
  canPrevious?: () => boolean;
  canNext?: () => boolean;
  onPrevious?: () => void;
  onNext?: () => void;
}

@Component({
  selector: 'app-two-options-dialog',
  templateUrl: './two-options-dialog.component.html',
  styleUrls: ['./two-options-dialog.component.scss']
})
export class TwoOptionsDialogComponent implements OnInit {

  public dataInjector: Injector;

  constructor(public dialogRef: MatDialogRef<TwoOptionsDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: ITwoOptionDialogData, private injector: Injector) { }

  ngOnInit(): void {
    if (this.data.component && this.data.componentInputData) {
      let providers = [];
      this.data.componentInputData.forEach(x => {
        providers.push({provide: x.Key, useValue: x.Value});
      });
      this.dataInjector = Injector.create({ providers: providers, parent: this.injector });
    }
  }
}
