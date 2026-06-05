import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // Los módulos de negocio se agregan aquí en sus módulos respectivos
      // { path: 'inventory', loadChildren: () => import('./modules/inventory/...') }
    ]
  },
  { path: '**', redirectTo: '' }
];
