import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttackVectorComponent } from './attack-vector.component';

describe('AttackVectorComponent', () => {
  let component: AttackVectorComponent;
  let fixture: ComponentFixture<AttackVectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AttackVectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AttackVectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
