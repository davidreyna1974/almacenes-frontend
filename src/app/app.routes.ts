import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { LoginComponent } from './modules/auth/login/login.component';
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
        loadChildren: () =>
          import('./modules/purchases/purchases.routes').then(m => m.PURCHASES_ROUTES)
      },
    ]
  },
  { path: '**', redirectTo: '' }
];
