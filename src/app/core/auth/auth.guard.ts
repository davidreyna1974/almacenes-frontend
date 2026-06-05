import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
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
