import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, ObservableInput} from 'rxjs';
import {concatMap, filter, first, flatMap, map} from 'rxjs/internal/operators';
import {ProviderCrawler, WeatherData} from './weather-data-crawler.service';

@Injectable({
  providedIn: 'root'
})
export class MeteoswissCrawlerService implements ProviderCrawler {

  name = 'meteoswiss';

  constructor(private  httpClient: HttpClient) {
  }

  private base = 'https://www.meteoschweiz.admin.ch';
  private dataURL = 'https://www.meteoschweiz.admin.ch/home.html?tab=overview';

  private static makeQuerieable(html: string) {
    const newHTMLDocument = document.implementation.createHTMLDocument('preview');
    const div = newHTMLDocument.createElement('div');
    div.innerHTML = html;
    return div;
  }

  async finalResult(locationName, overviewHtml: string) {
    const div = MeteoswissCrawlerService.makeQuerieable(overviewHtml);
    const forecastUrl = (div.querySelector('.overview__local-forecast') as HTMLElement).dataset.jsonUrl;
    const firstTowLetters = locationName.toLowerCase().substring(0, 2);

    const plzs = this.httpClient.get<string[]>(this.base + '/etc/designs/meteoswiss/ajax/search/' + firstTowLetters + '.json');
    return plzs.pipe(flatMap(e => e), map(e => {
        const [plz, , , , , candidate] = e.split(';');
        return [plz, candidate];
      }),
      filter(([plz, candidate]) => candidate.toLowerCase().indexOf(locationName.toLowerCase()) > -1),
      first(),
      map(e => e[0]),
      concatMap(plzForLocationName => {
        return this.httpClient.get(this.base + forecastUrl.replace(/\d{6}.json$/, plzForLocationName + '.json'));
      }),
      map(allData => {
        let [, low, high] = allData[0].variance_range[23];
        if (low == null) {
          low = high;
        }
        if (high == null) {
          high = low;
        }
        return {
          temperature: Number(((low + high) / 2).toFixed(1)),
          location: {
            name: locationName
          },
          provider: {
            name: this.name
          }
        };
      })
    );
  }

  getData(locationName: string): Observable<WeatherData> {
    return <Observable<WeatherData>>this.httpClient
      .get(this.dataURL, {
        responseType: 'text'
      })
      .pipe(
        flatMap(this.finalResult.bind(this, locationName)),
        flatMap((e): ObservableInput<WeatherData> => e as ObservableInput<WeatherData>));
  }
}
