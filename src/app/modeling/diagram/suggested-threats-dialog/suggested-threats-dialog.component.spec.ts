import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuggestedThreatsDialogComponent } from './suggested-threats-dialog.component';

describe('SuggestedThreatsDialogComponent', () => {
  let component: SuggestedThreatsDialogComponent;
  let fixture: ComponentFixture<SuggestedThreatsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuggestedThreatsDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuggestedThreatsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
