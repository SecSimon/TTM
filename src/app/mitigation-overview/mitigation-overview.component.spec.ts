import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitigationOverviewComponent } from './mitigation-overview.component';

describe('MitigationOverviewComponent', () => {
  let component: MitigationOverviewComponent;
  let fixture: ComponentFixture<MitigationOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MitigationOverviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MitigationOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
