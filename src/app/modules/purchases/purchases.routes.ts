import { Routes } from '@angular/router';
import { PurchasesComponent } from './purchases.component';
import { SuppliersPageComponent } from './components/suppliers-page/suppliers-page.component';
import { PurchaseOrdersPageComponent } from './components/purchase-orders-page/purchase-orders-page.component';
import { PurchaseOrderDetailPageComponent } from './components/purchase-order-detail-page/purchase-order-detail-page.component';
import { authGuard } from '../../core/auth/auth.guard';

export const PURCHASES_ROUTES: Routes = [
  {
    path: '',
    component: PurchasesComponent,
    children: [
      { path: 'suppliers',  component: SuppliersPageComponent },
      { path: 'orders',     component: PurchaseOrdersPageComponent },
      // 'orders/new' ANTES de 'orders/:id' para que Angular no interprete "new" como id
      {
        path: 'orders/new',
        component: PurchaseOrderDetailPageComponent,
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] },
      },
      {
        path: 'orders/:id',
        component: PurchaseOrderDetailPageComponent,
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN'] },
      },
    ]
  }
];
