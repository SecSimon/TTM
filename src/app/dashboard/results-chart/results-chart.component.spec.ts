import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultsChartComponent } from './results-chart.component';

describe('ResultsChartComponent', () => {
  let component: ResultsChartComponent;
  let fixture: ComponentFixture<ResultsChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResultsChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
