import { TestBed } from '@angular/core/testing';

import { ThreatEngineService } from './threat-engine.service';

describe('ThreatEngineService', () => {
  let service: ThreatEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThreatEngineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
