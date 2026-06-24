import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Register Brazilian Portuguese so DatePipe can format dates in pt-BR at runtime.
registerLocaleData(localePt, 'pt-BR');

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
