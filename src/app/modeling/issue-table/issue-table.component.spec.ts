import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueTableComponent } from './issue-table.component';

describe('IssueTableComponent', () => {
  let component: IssueTableComponent;
  let fixture: ComponentFixture<IssueTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IssueTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IssueTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
