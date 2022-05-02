import { TestBed } from '@angular/core/testing';

import { FileUpdateService } from './file-update.service';

describe('FileUpdateService', () => {
  let service: FileUpdateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileUpdateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
