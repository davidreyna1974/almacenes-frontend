import { Routes } from '@angular/router';
import { InventoryComponent } from './inventory.component';
import { ProductsPageComponent } from './components/products-page/products-page.component';
import { CategoriesPageComponent } from './components/categories-page/categories-page.component';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    component: InventoryComponent,
    children: [
      { path: 'products',   component: ProductsPageComponent },
      { path: 'categories', component: CategoriesPageComponent },
    ]
  }
];
