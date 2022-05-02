import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelingComponent } from './modeling.component';

describe('ModelingComponent', () => {
  let component: ModelingComponent;
  let fixture: ComponentFixture<ModelingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModelingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
