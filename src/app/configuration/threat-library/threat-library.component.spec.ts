import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreatLibraryComponent } from './threat-library.component';

describe('ThreatLibraryComponent', () => {
  let component: ThreatLibraryComponent;
  let fixture: ComponentFixture<ThreatLibraryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThreatLibraryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreatLibraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
