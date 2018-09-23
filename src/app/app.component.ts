import {Component, OnInit} from '@angular/core';
import {WeatherData, WeatherDataCrawlerService} from '../modules/data/weather-data-crawler.service';
import {FormControl} from '@angular/forms';
import {filter} from 'rxjs/internal/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  data: WeatherData;
  locationName = 'Chur';
  loading = true;
  search = new FormControl();

  constructor(private crawler: WeatherDataCrawlerService) {
  }

  ngOnInit(): void {
    this.search.setValue(this.locationName);
    this.showWeatherFor(this.locationName);
  }

  showWeatherFor(placeName: string) {
    this.crawler.fetch(placeName)
      .pipe(filter(data => !!data))
      .subscribe(data => {
        this.loading = false;
        this.data = data;
      }, (err) => {
        console.log(err);
      });
  }

  onEnter(value: string) {
    this.showWeatherFor(value);
  }
}
