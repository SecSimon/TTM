import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesDialogComponent } from './messages-dialog.component';

describe('MessagesDialogComponent', () => {
  let component: MessagesDialogComponent;
  let fixture: ComponentFixture<MessagesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessagesDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
