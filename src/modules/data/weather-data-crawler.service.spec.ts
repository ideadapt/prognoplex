import { TestBed } from '@angular/core/testing';

import { WeatherDataCrawlerService } from './weather-data-crawler.service';

describe('WeatherDataCrawlerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WeatherDataCrawlerService = TestBed.get(WeatherDataCrawlerService);
    expect(service).toBeTruthy();
  });
});
