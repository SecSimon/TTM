import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountermeasureComponent } from './countermeasure.component';

describe('CountermeasureComponent', () => {
  let component: CountermeasureComponent;
  let fixture: ComponentFixture<CountermeasureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CountermeasureComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CountermeasureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
