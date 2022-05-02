import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitigationsComponent } from './mitigations.component';

describe('MitigationsComponent', () => {
  let component: MitigationsComponent;
  let fixture: ComponentFixture<MitigationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MitigationsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MitigationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
