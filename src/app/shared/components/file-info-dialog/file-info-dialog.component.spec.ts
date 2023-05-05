import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileInfoDialogComponent } from './file-info-dialog.component';

describe('FileInfoDialogComponent', () => {
  let component: FileInfoDialogComponent;
  let fixture: ComponentFixture<FileInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileInfoDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
