import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwaspRREntryComponent } from './owasp-rr-entry.component';

describe('OwaspRREntryComponent', () => {
  let component: OwaspRREntryComponent;
  let fixture: ComponentFixture<OwaspRREntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OwaspRREntryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwaspRREntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
