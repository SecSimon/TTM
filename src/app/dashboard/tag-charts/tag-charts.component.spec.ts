import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagChartsComponent } from './tag-charts.component';

describe('TagChartsComponent', () => {
  let component: TagChartsComponent;
  let fixture: ComponentFixture<TagChartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TagChartsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagChartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
