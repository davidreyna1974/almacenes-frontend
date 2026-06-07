import { Routes } from '@angular/router';
import { PurchasesComponent } from './purchases.component';
import { SuppliersPageComponent } from './components/suppliers-page/suppliers-page.component';
import { PurchaseOrdersPageComponent } from './components/purchase-orders-page/purchase-orders-page.component';
import { PurchaseOrderDetailPageComponent } from './components/purchase-order-detail-page/purchase-order-detail-page.component';

export const PURCHASES_ROUTES: Routes = [
  {
    path: '',
    component: PurchasesComponent,
    children: [
      { path: 'suppliers',  component: SuppliersPageComponent },
      { path: 'orders',     component: PurchaseOrdersPageComponent },
      // 'orders/new' ANTES de 'orders/:id' para que Angular no interprete "new" como id
      { path: 'orders/new', component: PurchaseOrderDetailPageComponent },
      { path: 'orders/:id', component: PurchaseOrderDetailPageComponent },
    ]
  }
];
