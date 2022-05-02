import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharScopeComponent } from './char-scope.component';

describe('CharScopeComponent', () => {
  let component: CharScopeComponent;
  let fixture: ComponentFixture<CharScopeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CharScopeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CharScopeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
