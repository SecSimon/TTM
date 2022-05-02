import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitigationMappingComponent } from './mitigation-mapping.component';

describe('MitigationMappingComponent', () => {
  let component: MitigationMappingComponent;
  let fixture: ComponentFixture<MitigationMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MitigationMappingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MitigationMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
