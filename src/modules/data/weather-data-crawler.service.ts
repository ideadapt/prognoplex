import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/internal/operators';

export interface WeatherData {
  temperature: number;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherDataCrawlerService {

  constructor(private  httpClient: HttpClient) {
  }
  private dataURL = 'http://www.meteocentrale.ch/de/europa/schweiz/wetter-chur/details/S067860/';

  static htmlToModel(html: string): WeatherData {
    const newHTMLDocument = document.implementation.createHTMLDocument('preview');
    const div = newHTMLDocument.createElement('div');
    div.innerHTML = html;

    const part = div.querySelector('#lower-content');
    const details = part.querySelector('.detail-table-container');
    const temps = details.querySelectorAll('td[title=Temperatur]');
    return {
      temperature: Number(temps[0].innerHTML.split(' ')[0])
    };
  }

  fetch(): Observable<WeatherData> {
    return <Observable<WeatherData>>this.httpClient
      .get(this.dataURL, {
        responseType: 'text'
      })
      .pipe(map(WeatherDataCrawlerService.htmlToModel));
  }
}
