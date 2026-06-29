import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';
import { InventoryComponent } from './inventory.component';
import { ProductsPageComponent } from './components/products-page/products-page.component';
import { CategoriesPageComponent } from './components/categories-page/categories-page.component';
import { LowStockPageComponent } from './components/low-stock-page/low-stock-page.component';

const ALL_ROLES = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'];

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    component: InventoryComponent,
    children: [
      { path: 'products',   component: ProductsPageComponent,   canActivate: [authGuard], data: { roles: ALL_ROLES } },
      { path: 'categories', component: CategoriesPageComponent, canActivate: [authGuard], data: { roles: ALL_ROLES } },
      { path: 'low-stock',  component: LowStockPageComponent,   canActivate: [authGuard], data: { roles: ALL_ROLES } },
    ]
  }
];
