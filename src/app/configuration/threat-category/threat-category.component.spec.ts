import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreatCategoryComponent } from './threat-category.component';

describe('ThreatCategoryComponent', () => {
  let component: ThreatCategoryComponent;
  let fixture: ComponentFixture<ThreatCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThreatCategoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreatCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
