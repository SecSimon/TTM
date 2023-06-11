import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskOverviewComponent } from './risk-overview.component';

describe('RiskOverviewComponent', () => {
  let component: RiskOverviewComponent;
  let fixture: ComponentFixture<RiskOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskOverviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RiskOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
