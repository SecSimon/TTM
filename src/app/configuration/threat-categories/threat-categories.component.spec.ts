import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreatCategoriesComponent } from './threat-categories.component';

describe('ThreatCategoriesComponent', () => {
  let component: ThreatCategoriesComponent;
  let fixture: ComponentFixture<ThreatCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThreatCategoriesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreatCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
