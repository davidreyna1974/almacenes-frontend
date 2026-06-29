import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter, DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS, MatDateFormats } from '@angular/material/core';
import { DdMmYyyyDateAdapter } from './core/date/dd-mm-yyyy-date-adapter';
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

/**
 * Formato de fecha estándar del proyecto: dd/MM/yyyy (ver CLAUDE.md).
 *
 * El adapter nativo de Angular Material usa Intl con el locale provisto. Con el
 * locale por defecto (en-US) los datepickers mostraban y parseaban M/d/yyyy, en
 * contradicción con el estándar documentado. Se fija `MAT_DATE_LOCALE` a 'es-PE'
 * (orden día/mes, acorde a la UI en español) y se sobrescribe `dateInput` con
 * día y mes de 2 dígitos para obtener exactamente dd/MM/yyyy con ceros a la
 * izquierda. Esto afecta únicamente a los MatDatepicker; las fechas de tablas ya
 * usaban DatePipe con formato 'dd/MM/yyyy' explícito.
 *
 * El locale solo corrige el FORMATO de salida del adapter nativo; el parseo de
 * texto tecleado lo cubre `DdMmYyyyDateAdapter` (override de `parse()`), de modo
 * que teclear "31/12/2026" se interpreta correctamente como dd/MM/yyyy.
 */
const APP_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: { year: 'numeric', month: 'numeric', day: 'numeric' },
  },
  display: {
    dateInput: { year: 'numeric', month: '2-digit', day: '2-digit' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    { provide: DateAdapter, useClass: DdMmYyyyDateAdapter },
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(
      withInterceptors([jwtInterceptor, errorInterceptor])
    ),
  ]
};
