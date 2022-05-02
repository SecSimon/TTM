import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceThreatComponent } from './device-threat.component';

describe('DeviceThreatComponent', () => {
  let component: DeviceThreatComponent;
  let fixture: ComponentFixture<DeviceThreatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeviceThreatComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceThreatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
