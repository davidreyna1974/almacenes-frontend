import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        localStorage.removeItem('almacenes_token');
        router.navigate(['/login'], { queryParams: { expired: 'true' } });
        snackBar.open(
          'Tu sesión ha expirado. Inicia sesión nuevamente.',
          'Cerrar',
          { duration: 5000, panelClass: ['snackbar-error'] }
        );
      } else if (error.status === 403 && !req.url.includes('/auth/login')) {
        snackBar.open(
          'No tienes permiso para realizar esta acción.',
          'Cerrar',
          { duration: 4000, panelClass: ['snackbar-error'] }
        );
      }
      return throwError(() => error);
    })
  );
};
