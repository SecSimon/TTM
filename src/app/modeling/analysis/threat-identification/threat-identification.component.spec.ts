import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreatIdentificationComponent } from './threat-identification.component';

describe('ThreatIdentificationComponent', () => {
  let component: ThreatIdentificationComponent;
  let fixture: ComponentFixture<ThreatIdentificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThreatIdentificationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreatIdentificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
