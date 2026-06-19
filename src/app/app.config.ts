import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/jwt.interceptor';
import { errorInterceptor } from './core/auth/error.interceptor';
import { GlobalErrorHandler } from './core/error-handler/global-error-handler';

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
