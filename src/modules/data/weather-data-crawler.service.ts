import {Injectable} from '@angular/core';
import {concat, Observable, of} from 'rxjs';
import {tap} from 'rxjs/internal/operators';
import {DB, default as idb} from 'idb';
import {MeteocentraleCrawlerService} from './meteocentrale-crawler.service';

export interface WeatherData {
  temperature: number;
  location: {
    name: string
  };
  provider: {
    name: string
  };
}

export interface ProviderCrawler {
  getData(locationName: string): Observable<WeatherData>;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherDataCrawlerService {
  private readonly db: Promise<DB>;

  constructor(private meteoCentrale: MeteocentraleCrawlerService) {
    this.db = idb.open('wemux', 1, upgradeDB => {
      upgradeDB.createObjectStore('datastore');
    });
  }

  async fetchFromLocal(item: WeatherData): Promise<WeatherData> {
    const db = await this.db;
    const key = item.provider.name + ':' + item.location.name;
    const data = await db.transaction('datastore', 'readonly').objectStore('datastore').get(key);
    return of(data).toPromise();
  }

  async storeLocal(item: WeatherData) {
    const db = await this.db;
    const tx = db.transaction('datastore', 'readwrite');
    const clone = {...item};
    clone.temperature = item.temperature * 10;
    const key = clone.provider.name + ':' + clone.location.name;
    tx.objectStore('datastore').put(clone, key);
    await tx.complete;
  }

  fetch(locationName: string): Observable<WeatherData> {
    const apiData = this.meteoCentrale
      .getData(locationName)
      .pipe(tap(this.storeLocal.bind(this)));

    const item = {location: {name: locationName}, provider: {name: 'meteocentrale'}} as WeatherData;
    return concat(this.fetchFromLocal(item), apiData);
  }
}
