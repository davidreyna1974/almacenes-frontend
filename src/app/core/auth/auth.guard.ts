import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const state = authService.getTokenState();
  if (state === 'expired') {
    router.navigate(['/login'], { queryParams: { reason: 'expired' } });
    return false;
  }
  if (state === 'invalid') {
    router.navigate(['/login'], { queryParams: { reason: 'invalid' } });
    return false;
  }
  if (state === 'missing') {
    router.navigate(['/login']);
    return false;
  }

  const requiredRoles: string[] = route.data?.['roles'] ?? [];
  if (requiredRoles.length > 0 && !requiredRoles.some(r => authService.hasRole(r))) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
