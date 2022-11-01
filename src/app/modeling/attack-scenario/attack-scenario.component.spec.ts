import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttackScenarioComponent } from './attack-scenario.component';

describe('AttackScenarioComponent', () => {
  let component: AttackScenarioComponent;
  let fixture: ComponentFixture<AttackScenarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AttackScenarioComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AttackScenarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
