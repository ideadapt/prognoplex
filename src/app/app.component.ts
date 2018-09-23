import {Component, OnInit} from '@angular/core';
import {Provider, WeatherData, WeatherDataCrawlerService} from '../modules/data/weather-data-crawler.service';
import {FormControl} from '@angular/forms';

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
  data: Map<string, Map<string, WeatherData & WeatherViewData>> = new Map();
  activeSearchTerm = 'Chur';
  loading = true;
  providers: Provider[] = [{name: 'meteocentrale'}];
  search = new FormControl();

  constructor(private crawler: WeatherDataCrawlerService) {
  }

  ngOnInit(): void {
    this.search.setValue(this.activeSearchTerm);
    this.showWeatherFor(this.activeSearchTerm);
  }

  getKeys(map) {
    return Array.from(map.keys());
  }

  showWeatherFor(locationName: string) {
    const provider = this.providers[0].name;
    this.crawler.fetch(locationName)
    //.pipe(filter(data => !!data))
      .subscribe(weatherData => {
        let locationModel = this.data.get(locationName);
        if (!locationModel) {
          locationModel = new Map();
          this.providers.forEach(prov => {
            locationModel.set(prov.name, {loading: true, provider: {name: prov.name}} as ViewModel);
          });
          this.data.set(locationName, locationModel);
        }

        Object.assign(locationModel.get(provider), <ViewModel> weatherData);
      }, err => {
        console.error(err);
      }, () => {
        this.data.get(locationName).get(provider).loading = false;
      });
  }

  onEnter(value: string) {
    this.showWeatherFor(value);
  }
}
