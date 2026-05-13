import { Route } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { RemoteErrorComponent } from './remote-error.component';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      loadRemoteModule('billsMFE', './Component')
        .then((m) => m.AppComponent)
        .catch(() => RemoteErrorComponent),
  },
  {
    path: 'pay/:billId',
    loadComponent: () =>
      loadRemoteModule('paymentMFE', './Component')
        .then((m) => m.AppComponent)
        .catch(() => RemoteErrorComponent),
  },
];
