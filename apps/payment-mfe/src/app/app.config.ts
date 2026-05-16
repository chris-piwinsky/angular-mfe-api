import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { archGuardInterceptor } from './arch-guard.interceptor';
import { archNoteInterceptor } from './arch-note.interceptor';
import {
  provideRouter,
  ActivatedRoute,
  convertToParamMap,
} from '@angular/router';
import { APP_CONFIG } from '@billing-portal/shared/app-config';

// Mock ActivatedRoute for standalone dev mode — provides billId='bill-001'
const mockActivatedRoute = {
  snapshot: {
    paramMap: convertToParamMap({ billId: 'bill-001' }),
  },
} as unknown as ActivatedRoute;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withFetch(),
      withInterceptors([archGuardInterceptor, archNoteInterceptor]),
    ),
    provideRouter([]),
    // Override ActivatedRoute for standalone dev mode
    { provide: ActivatedRoute, useValue: mockActivatedRoute },
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
