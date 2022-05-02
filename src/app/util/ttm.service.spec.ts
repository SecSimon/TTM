import { TestBed } from '@angular/core/testing';

import { TTMService } from './ttm.service';

describe('TTMService', () => {
  let service: TTMService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TTMService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
