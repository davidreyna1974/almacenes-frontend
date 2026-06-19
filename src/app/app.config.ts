import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import * as Sentry from '@sentry/angular';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/jwt.interceptor';
import { errorInterceptor } from './core/auth/error.interceptor';
import { GlobalErrorHandler } from './core/error-handler/global-error-handler';
import { environment } from '../environments/environment';

if (environment.sentryDsn) {
  Sentry.init({
    dsn: environment.sentryDsn,
    environment: environment.production ? 'production' : 'development',
    ignoreErrors: ['ChunkLoadError', 'NetworkError'],
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
      }
      if (event.request?.data) {
        delete event.request.data;
      }
      return event;
    },
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(
      withInterceptors([jwtInterceptor, errorInterceptor])
    ),
  ]
};
