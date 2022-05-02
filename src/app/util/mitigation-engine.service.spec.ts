import { TestBed } from '@angular/core/testing';

import { MitigationEngineService } from './mitigation-engine.service';

describe('MitigationEngineService', () => {
  let service: MitigationEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MitigationEngineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
