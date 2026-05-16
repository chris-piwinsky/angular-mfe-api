import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { APP_CONFIG } from '@billing-portal/shared/app-config';

export const archGuardInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(APP_CONFIG);

  if (!req.url.startsWith(config.bffBaseUrl)) {
    console.warn(
      '[ARCH VIOLATION] Micro frontend is calling a domain API directly. ' +
        'All requests must go through the BFF.',
    );

    if (
      req.method === 'POST' &&
      (req.url.includes(':4001') || req.url.includes('bills-api'))
    ) {
      console.warn(
        '[ARCH VIOLATION] payment-mfe must not call bills-api directly. ' +
          'Use /api/payments via the BFF.',
      );
    }
  }

  return next(req);
};
