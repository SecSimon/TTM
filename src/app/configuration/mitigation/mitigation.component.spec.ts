import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitigationComponent } from './mitigation.component';

describe('MitigationComponent', () => {
  let component: MitigationComponent;
  let fixture: ComponentFixture<MitigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MitigationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MitigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
