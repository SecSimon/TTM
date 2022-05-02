import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreatRuleComponent } from './threat-rule.component';

describe('ThreatRuleComponent', () => {
  let component: ThreatRuleComponent;
  let fixture: ComponentFixture<ThreatRuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThreatRuleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreatRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
