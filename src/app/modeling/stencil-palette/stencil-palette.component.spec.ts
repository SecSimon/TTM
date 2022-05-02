import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StencilPaletteComponent } from './stencil-palette.component';

describe('StencilPaletteComponent', () => {
  let component: StencilPaletteComponent;
  let fixture: ComponentFixture<StencilPaletteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StencilPaletteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StencilPaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
