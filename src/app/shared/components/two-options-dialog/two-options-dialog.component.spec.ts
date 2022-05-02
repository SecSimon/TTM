import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoOptionsDialogComponent } from './two-options-dialog.component';

describe('TwoOptionsDialogComponent', () => {
  let component: TwoOptionsDialogComponent;
  let fixture: ComponentFixture<TwoOptionsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TwoOptionsDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwoOptionsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
