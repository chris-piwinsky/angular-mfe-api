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
  }

  return next(req);
};
