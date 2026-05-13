import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';

/**
 * Reads x-arch-note header from BFF responses and emits suite:arch:event CustomEvent.
 * This is a learning tool that narrates architectural decisions in real time.
 */
export const archNoteInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    tap((event) => {
      if (event.type === 4) {
        // HttpResponse event
        const archNote = event.headers.get('x-arch-note');
        if (archNote) {
          const [code, description] = archNote.split('|');
          const requestId = (event.body as { requestId?: string })?.requestId || 'unknown';

          window.dispatchEvent(
            new CustomEvent('suite:arch:event', {
              detail: {
                code,
                description,
                requestId,
                timestamp: Date.now(),
                layer: 'bff',
              },
            })
          );
        }
      }
    })
  );
};
