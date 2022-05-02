import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CapecEntryComponent } from './capec-entry.component';

describe('CapecEntryComponent', () => {
  let component: CapecEntryComponent;
  let fixture: ComponentFixture<CapecEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CapecEntryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CapecEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
