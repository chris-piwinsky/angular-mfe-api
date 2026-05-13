import { InjectionToken } from '@angular/core';

export interface AppConfig {
  bffBaseUrl: string;
  authHeader: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
