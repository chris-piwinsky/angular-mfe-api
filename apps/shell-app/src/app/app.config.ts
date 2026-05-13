import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { APP_CONFIG } from './app-config.token';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withFetch()),
    {
      provide: APP_CONFIG,
      useValue: {
        bffBaseUrl: 'http://localhost:3001',
        authHeader: 'Bearer demo-token',
      },
    },
  ],
};
