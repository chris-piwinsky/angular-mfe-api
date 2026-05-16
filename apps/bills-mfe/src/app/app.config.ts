import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { APP_CONFIG } from '@billing-portal/shared/app-config';
import { archGuardInterceptor } from './arch-guard.interceptor';
import { archNoteInterceptor } from './arch-note.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withFetch(),
      withInterceptors([archGuardInterceptor, archNoteInterceptor]),
    ),
    // Standalone dev mode only — shell provider takes precedence when loaded as remote
    {
      provide: APP_CONFIG,
      useValue: {
        bffBaseUrl: 'http://localhost:3001',
        authHeader: 'Bearer demo-token',
      },
    },
  ],
};
