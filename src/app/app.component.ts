import {Component, OnInit} from '@angular/core';
import {WeatherData, WeatherDataCrawlerService} from '../modules/data/weather-data-crawler.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'Progno Plex';
  data: WeatherData;

  constructor(private crawler: WeatherDataCrawlerService) { }

  ngOnInit(): void {
    this.crawler.fetch().subscribe((data) => {
      this.data = data;
    }, (err) => {
      console.log(err);
    });
  }
}
