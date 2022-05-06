import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreatActorComponent } from './threat-actor.component';

describe('ThreatActorComponent', () => {
  let component: ThreatActorComponent;
  let fixture: ComponentFixture<ThreatActorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThreatActorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreatActorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
