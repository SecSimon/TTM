import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportTemplateComponent } from './export-template.component';

describe('ExportTemplateComponent', () => {
  let component: ExportTemplateComponent;
  let fixture: ComponentFixture<ExportTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExportTemplateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
