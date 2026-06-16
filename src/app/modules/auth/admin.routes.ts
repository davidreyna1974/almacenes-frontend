import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'users',
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] },
    loadComponent: () =>
      import('./users-page/users-page.component').then(m => m.UsersPageComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'] },
    loadComponent: () =>
      import('./profile-page/profile-page.component').then(m => m.ProfilePageComponent),
  },
];
