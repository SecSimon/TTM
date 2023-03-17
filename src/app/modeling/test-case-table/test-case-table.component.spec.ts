import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestCaseTableComponent } from './test-case-table.component';

describe('TestCaseTableComponent', () => {
  let component: TestCaseTableComponent;
  let fixture: ComponentFixture<TestCaseTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestCaseTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestCaseTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
