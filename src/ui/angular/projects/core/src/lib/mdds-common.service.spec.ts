import { TestBed } from '@angular/core/testing';

import { MddsCommonService } from './mdds-common.service';

describe('MddsCommonModule', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MddsCommonService = TestBed.get(MddsCommonService);
    expect(service).toBeTruthy();
  });
});
