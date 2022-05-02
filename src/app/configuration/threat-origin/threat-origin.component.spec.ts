import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreatOriginComponent } from './threat-origin.component';

describe('ThreatOriginComponent', () => {
  let component: ThreatOriginComponent;
  let fixture: ComponentFixture<ThreatOriginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThreatOriginComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreatOriginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
