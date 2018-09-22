import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {concat, Observable, of} from 'rxjs';
import {map, tap} from 'rxjs/internal/operators';
import {default as idb} from 'idb';

export interface WeatherData {
  temperature: number;
  location: { name: string };
}

@Injectable({
  providedIn: 'root'
})
export class WeatherDataCrawlerService {

  constructor(private  httpClient: HttpClient) {
    this.db = idb.open('datastore', 1, upgradeDB => {
      upgradeDB.createObjectStore('datastore');
    });
  }

  private dataURL = 'http://www.meteocentrale.ch/de/europa/schweiz/wetter-chur/details/S067860/';
  private db;

  static htmlToModel(html: string): WeatherData {
    const newHTMLDocument = document.implementation.createHTMLDocument('preview');
    const div = newHTMLDocument.createElement('div');
    div.innerHTML = html;

    const part = div.querySelector('#lower-content');
    const details = part.querySelector('.detail-table-container');
    const temps = details.querySelectorAll('td[title=Temperatur]');
    return {
      temperature: Number(temps[0].innerHTML.split(' ')[0]),
      location: {
        name: 'Chur'
      }
    };
  }

  async fetchFromLocal(): Promise<WeatherData> {
    const db = await this.db;
    const data = await db.transaction('datastore').objectStore('datastore').getAll();
    return of(data[0]).toPromise();
  }

  async storeLocal(item: WeatherData) {
    const db = await this.db;
    const tx = db.transaction('datastore', 'readwrite');
    const clone = {...item};
    clone.temperature = item.temperature * 10;
    tx.objectStore('datastore').put(clone, 1);
    await tx.complete;
  }

  fetch(): Observable<WeatherData> {
    const apiData = <Observable<WeatherData>>this.httpClient
      .get(this.dataURL, {
        responseType: 'text'
      })
      .pipe(map(WeatherDataCrawlerService.htmlToModel))
      .pipe(tap(this.storeLocal.bind(this)));

    return concat(this.fetchFromLocal(), apiData);
  }
}
