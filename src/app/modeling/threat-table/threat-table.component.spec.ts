import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreatTableComponent } from './threat-table.component';

describe('ThreatTableComponent', () => {
  let component: ThreatTableComponent;
  let fixture: ComponentFixture<ThreatTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThreatTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreatTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
