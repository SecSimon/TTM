import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CweEntryComponent } from './cwe-entry.component';

describe('CweEntryComponent', () => {
  let component: CweEntryComponent;
  let fixture: ComponentFixture<CweEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CweEntryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CweEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
