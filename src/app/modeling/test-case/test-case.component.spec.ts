import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestCaseComponent } from './test-case.component';

describe('TestCaseComponent', () => {
  let component: TestCaseComponent;
  let fixture: ComponentFixture<TestCaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestCaseComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestCaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
