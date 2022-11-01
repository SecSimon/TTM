import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountermeasureTableComponent } from './countermeasure-table.component';

describe('CountermeasureTableComponent', () => {
  let component: CountermeasureTableComponent;
  let fixture: ComponentFixture<CountermeasureTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CountermeasureTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CountermeasureTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
