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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // Los módulos de negocio se agregan aquí en sus módulos respectivos
    ]
  },
  { path: '**', redirectTo: '' }
];
