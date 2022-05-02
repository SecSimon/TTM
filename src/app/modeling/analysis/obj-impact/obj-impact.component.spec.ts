import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjImpactComponent } from './obj-impact.component';

describe('ObjImpactComponent', () => {
  let component: ObjImpactComponent;
  let fixture: ComponentFixture<ObjImpactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObjImpactComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjImpactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
