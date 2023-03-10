import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferProjectDialogComponent } from './transfer-project-dialog.component';

describe('TransferProjectDialogComponent', () => {
  let component: TransferProjectDialogComponent;
  let fixture: ComponentFixture<TransferProjectDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransferProjectDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransferProjectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
