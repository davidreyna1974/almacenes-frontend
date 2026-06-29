import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const state = authService.getTokenState();
  if (state === 'expired') {
    return router.createUrlTree(['/login'], { queryParams: { reason: 'expired' } });
  }
  if (state === 'invalid') {
    return router.createUrlTree(['/login'], { queryParams: { reason: 'invalid' } });
  }
  if (state === 'missing') {
    return router.createUrlTree(['/login']);
  }

  const requiredRoles: string[] = route.data?.['roles'] ?? [];
  if (requiredRoles.length > 0 && !requiredRoles.some(r => authService.hasRole(r))) {
    return router.createUrlTree(['/access-denied']);
  }

  return true;
};
