import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreatSourcesComponent } from './threat-sources.component';

describe('ThreatSourcesComponent', () => {
  let component: ThreatSourcesComponent;
  let fixture: ComponentFixture<ThreatSourcesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThreatSourcesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreatSourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
