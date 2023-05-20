import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelTasksComponent } from './model-tasks.component';

describe('ModelTasksComponent', () => {
  let component: ModelTasksComponent;
  let fixture: ComponentFixture<ModelTasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModelTasksComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
