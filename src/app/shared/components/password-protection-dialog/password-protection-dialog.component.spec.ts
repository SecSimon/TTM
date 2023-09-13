import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordProtectionDialogComponent } from './password-protection-dialog.component';

describe('PasswordProtectionDialogComponent', () => {
  let component: PasswordProtectionDialogComponent;
  let fixture: ComponentFixture<PasswordProtectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PasswordProtectionDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasswordProtectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
