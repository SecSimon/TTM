import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreatMappingComponent } from './threat-mapping.component';

describe('ThreatMappingComponent', () => {
  let component: ThreatMappingComponent;
  let fixture: ComponentFixture<ThreatMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThreatMappingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreatMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
