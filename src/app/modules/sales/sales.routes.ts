import { Routes } from '@angular/router';
import { SalesComponent } from './sales.component';
import { ClientsPageComponent } from './components/clients-page/clients-page.component';
import { SaleOrdersPageComponent } from './components/sale-orders-page/sale-orders-page.component';
import { SaleOrderDetailPageComponent } from './components/sale-order-detail-page/sale-order-detail-page.component';
import { ReservationsPageComponent } from './components/reservations-page/reservations-page.component';
import { authGuard } from '../../core/auth/auth.guard';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    component: SalesComponent,
    children: [
      { path: 'clients',      component: ClientsPageComponent },
      { path: 'orders',       component: SaleOrdersPageComponent },
      // 'orders/new' ANTES de 'orders/:id' para que Angular no interprete "new" como id
      {
        path: 'orders/new',
        component: SaleOrderDetailPageComponent,
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_SALES'] },
      },
      {
        path: 'orders/:id',
        component: SaleOrderDetailPageComponent,
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'] },
      },
      { path: 'reservations', component: ReservationsPageComponent },
    ]
  }
];
