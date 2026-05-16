const {
  withNativeFederation,
  shareAll,
} = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'payment-mfe',

  exposes: {
    './Component': './apps/payment-mfe/src/app/app.component.ts',
  },

  shared: {
    '@billing-portal/shared/app-config': {
      singleton: true,
      strictVersion: false,
      requiredVersion: 'auto',
    },
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
  },

  skip: ['rxjs/ajax', 'rxjs/fetch', 'rxjs/testing', 'rxjs/webSocket'],

  features: {
    ignoreUnusedDeps: true,
  },
});
