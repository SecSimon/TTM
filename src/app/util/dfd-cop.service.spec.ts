import { TestBed } from '@angular/core/testing';

import { DfdCopService } from './dfd-cop.service';

describe('DfdCopService', () => {
  let service: DfdCopService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DfdCopService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
