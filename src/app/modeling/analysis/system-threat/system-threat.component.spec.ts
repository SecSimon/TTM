import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemThreatComponent } from './system-threat.component';

describe('SystemThreatComponent', () => {
  let component: SystemThreatComponent;
  let fixture: ComponentFixture<SystemThreatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SystemThreatComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SystemThreatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
