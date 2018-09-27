import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {concatMap, map} from 'rxjs/internal/operators';
import {ProviderCrawler, WeatherData} from './weather-data-crawler.service';

@Injectable({
  providedIn: 'root'
})
export class MeteocentraleCrawlerService implements ProviderCrawler {

  name = 'meteocentrale';

  constructor(private  httpClient: HttpClient) {
  }

  private base = 'http://www.meteocentrale.ch/';
  private dataURL = 'http://www.meteocentrale.ch/index.php?L=1&id=1199&searchString=';

  private static makeQuerieable(html: string) {
    const newHTMLDocument = document.implementation.createHTMLDocument('preview');
    const div = newHTMLDocument.createElement('div');
    div.innerHTML = html;
    return div;
  }

  private htmlToModel(locationName: string, html: string): WeatherData {
    const div = MeteocentraleCrawlerService.makeQuerieable(html);
    const part = div.querySelector('#lower-content');
    const details = part.querySelector('.detail-table-container');
    const temps = details.querySelectorAll('td[title=Temperatur]');
    return {
      temperature: Number(Number(temps[0].innerHTML.split(' ')[0]).toFixed(2)),
      location: {
        name: locationName
      },
      provider: {
        name: this.name
      }
    };
  }

  private finalResult(intermediateHtml: string): Observable<string> {
    // either: choose first of multiple places OR fetch redirect target
    const div = MeteocentraleCrawlerService.makeQuerieable(intermediateHtml);
    const locationGuess = div.querySelector('#lower-content a.search-entry[href*=details]');
    let target = '';
    if (locationGuess) {
      const link = (locationGuess as HTMLLinkElement);
      const linkBase = link.baseURI;
      target = link.href.replace(linkBase, this.base);
    } else {
      const redirectToMatch = intermediateHtml.match(/window\.location\.href = '(.*)'/);
      if (redirectToMatch) {
        target = this.base + redirectToMatch[1];
      }
    }

    return this.httpClient
      .get(target, {
        responseType: 'text'
      });
  }

  getData(locationName: string): Observable<WeatherData> {
    return <Observable<WeatherData>>this.httpClient
      .get(this.dataURL + locationName, {
        responseType: 'text'
      })
      .pipe(concatMap(this.finalResult.bind(this)))
      .pipe(map(this.htmlToModel.bind(this, locationName)));
  }
}
