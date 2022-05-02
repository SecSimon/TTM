import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CvssEntryComponent } from './cvss-entry.component';

describe('CvssEntryComponent', () => {
  let component: CvssEntryComponent;
  let fixture: ComponentFixture<CvssEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CvssEntryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CvssEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
