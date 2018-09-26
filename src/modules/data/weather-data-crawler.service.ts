import {Injectable} from '@angular/core';
import {concat, Observable, of} from 'rxjs';
import {tap} from 'rxjs/internal/operators';
import {DB, default as idb} from 'idb';
import {MeteoswissCrawlerService} from './meteoswiss-crawler.service';

export interface WeatherData {
  temperature: number;
  location: Location;
  provider: Provider;
}

export interface Location {
  name: string;
}

export interface Provider {
  name: string;
}

export interface ProviderCrawler {
  getData(locationName: string): Observable<WeatherData>;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherDataCrawlerService {

  constructor(/*private crawler: MeteocentraleCrawlerService*/private crawler: MeteoswissCrawlerService) {
    this.db = idb.open('wemux', 1, upgradeDB => {
      upgradeDB.createObjectStore('datastore');
    });
  }

  private readonly db: Promise<DB>;

  static keyOf(item: WeatherData) {
    return item.provider.name + ':' + item.location.name;
  }

  async fetchFromLocal(item: WeatherData): Promise<WeatherData> {
    const db = await this.db;
    const data = await db.transaction('datastore', 'readonly')
      .objectStore('datastore')
      .get(WeatherDataCrawlerService.keyOf(item));
    return of(data).toPromise();
  }

  async storeLocal(item: WeatherData) {
    const db = await this.db;
    const clone = {...item};
    const tx = db.transaction('datastore', 'readwrite');
    tx.objectStore('datastore')
      .put(clone, WeatherDataCrawlerService.keyOf(item));
    await tx.complete;
  }

  fetch(locationName: string): Observable<WeatherData> {
    const apiData = this.crawler
      .getData(locationName)
      .pipe(tap(this.storeLocal.bind(this)));

    const item = {location: {name: locationName}, provider: {name: 'meteocentrale'}} as WeatherData;
    return concat(this.fetchFromLocal(item), apiData);
  }
}
