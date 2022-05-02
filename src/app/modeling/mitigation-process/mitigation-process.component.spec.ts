import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitigationProcessComponent } from './mitigation-process.component';

describe('MitigationProcessComponent', () => {
  let component: MitigationProcessComponent;
  let fixture: ComponentFixture<MitigationProcessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MitigationProcessComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MitigationProcessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
