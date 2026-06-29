import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as Sentry from '@sentry/angular';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private snackBar = inject(MatSnackBar);
  private zone     = inject(NgZone);

  handleError(error: unknown): void {
    try {
      console.error('[GlobalErrorHandler]', error);
      Sentry.captureException(error);
      this.zone.run(() => {
        this.snackBar.open(
          'Error inesperado. Por favor recarga la página.',
          'Cerrar',
          { duration: 6000, panelClass: ['snackbar-error'] }
        );
      });
    } catch {
      // evitar loop infinito si el propio handler falla
    }
  }
}
