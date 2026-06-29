import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { LoginComponent } from './modules/auth/login/login.component';
import { NotFoundComponent } from './modules/not-found/not-found.component';
import { AccessDeniedComponent } from './modules/access-denied/access-denied.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'inventory',
        loadChildren: () =>
          import('./modules/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES)
      },
      {
        path: 'purchases',
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN'] },
        loadChildren: () =>
          import('./modules/purchases/purchases.routes').then(m => m.PURCHASES_ROUTES)
      },
      {
        path: 'sales',
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'] },
        loadChildren: () =>
          import('./modules/sales/sales.routes').then(m => m.SALES_ROUTES)
      },
      {
        path: 'reports',
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'] },
        loadChildren: () =>
          import('./modules/reports/reports.routes').then(m => m.REPORTS_ROUTES)
      },
      {
        path: 'admin',
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'] },
        loadChildren: () =>
          import('./modules/auth/admin.routes').then(m => m.ADMIN_ROUTES)
      },
    ]
  },
  { path: 'access-denied', component: AccessDeniedComponent },
  { path: '**', component: NotFoundComponent },
];
