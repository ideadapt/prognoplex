import {Component, OnInit} from '@angular/core';
import {ProviderCrawler, WeatherData, WeatherDataCrawlerService} from '../modules/data/weather-data-crawler.service';
import {FormControl} from '@angular/forms';
import {MeteocentraleCrawlerService} from '../modules/data/meteocentrale-crawler.service';
import {MeteoswissCrawlerService} from '../modules/data/meteoswiss-crawler.service';

interface WeatherViewData {
  loading: boolean;
}

type ViewModel = WeatherData & WeatherViewData;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  data: Map<string, Map<ProviderCrawler, WeatherData & WeatherViewData>> = new Map();
  activeSearchTerm = 'Chur';
  loading = true;
  providers: ProviderCrawler[] = [];
  search = new FormControl();

  constructor(private crawler: WeatherDataCrawlerService,
              meteocentrale: MeteocentraleCrawlerService,
              meteoswiss: MeteoswissCrawlerService) {
    this.providers.push(meteocentrale);
    this.providers.push(meteoswiss);
  }

  ngOnInit(): void {
    this.search.setValue(this.activeSearchTerm);
    this.showWeatherFor(this.activeSearchTerm);
  }

  getKeys(map) {
    return Array.from(map.keys());
  }

  showWeatherFor(locationName: string) {
    const locationModel = new Map();
    this.providers.forEach(p => {
      locationModel.set(p, {loading: true, provider: {name: p.name}} as ViewModel);
    });
    this.data.set(locationName, locationModel);

    this.providers.forEach(p => {
      this.crawler.fetch(locationName, p)
        .subscribe(weatherData => {
          Object.assign(locationModel.get(p), <ViewModel> weatherData);
        }, err => {
          console.error(err);
        }, () => {
          this.data.get(locationName).get(p).loading = false;
        });
    });
  }

  onEnter(value: string) {
    this.showWeatherFor(value);
  }
}
