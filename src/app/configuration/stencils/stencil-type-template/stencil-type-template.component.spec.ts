import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StencilTypeTemplateComponent } from './stencil-type-template.component';

describe('StencilTypeTemplateComponent', () => {
  let component: StencilTypeTemplateComponent;
  let fixture: ComponentFixture<StencilTypeTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StencilTypeTemplateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StencilTypeTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
