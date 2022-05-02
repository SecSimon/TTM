import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceAssetsComponent } from './device-assets.component';

describe('DeviceAssetsComponent', () => {
  let component: DeviceAssetsComponent;
  let fixture: ComponentFixture<DeviceAssetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeviceAssetsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceAssetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
