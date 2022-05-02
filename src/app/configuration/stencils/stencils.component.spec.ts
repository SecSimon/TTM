import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StencilsComponent } from './stencils.component';

describe('StencilsComponent', () => {
  let component: StencilsComponent;
  let fixture: ComponentFixture<StencilsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StencilsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StencilsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
