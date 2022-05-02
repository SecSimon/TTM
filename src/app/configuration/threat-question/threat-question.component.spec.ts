import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreatQuestionComponent } from './threat-question.component';

describe('ThreatQuestionComponent', () => {
  let component: ThreatQuestionComponent;
  let fixture: ComponentFixture<ThreatQuestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThreatQuestionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreatQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
