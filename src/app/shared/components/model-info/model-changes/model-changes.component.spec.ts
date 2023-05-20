import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelChangesComponent } from './model-changes.component';

describe('ModelChangesComponent', () => {
  let component: ModelChangesComponent;
  let fixture: ComponentFixture<ModelChangesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModelChangesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelChangesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
