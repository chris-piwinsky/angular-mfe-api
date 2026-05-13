// Single source of truth lives in the shared lib.
// Re-export so existing imports in shell-app still resolve.
export type { AppConfig } from '@billing-portal/shared/app-config';
export { APP_CONFIG } from '@billing-portal/shared/app-config';
