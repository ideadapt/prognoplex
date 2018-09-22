import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import {patchXHROpen} from './modules/core/cors-everywhere';

if (environment.production) {
  enableProdMode();
}

patchXHROpen();

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

