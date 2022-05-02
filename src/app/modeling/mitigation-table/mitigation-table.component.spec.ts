import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitigationTableComponent } from './mitigation-table.component';

describe('MitigationTableComponent', () => {
  let component: MitigationTableComponent;
  let fixture: ComponentFixture<MitigationTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MitigationTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MitigationTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
