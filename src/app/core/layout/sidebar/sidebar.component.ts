import { Component, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { LayoutService } from '../layout.service';
import { AuthService } from '../../auth/auth.service';

interface NavChild {
  label: string;
  icon:  string;
  route: string;
  roles: string[];
}

interface NavItem {
  label:     string;
  icon:      string;
  route?:    string;
  roles:     string[];
  children?: NavChild[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    label: 'Inventario', icon: 'inventory_2',
    roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'],
    children: [
      { label: 'Productos',   icon: 'shopping_bag',  route: '/inventory/products',
        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'] },
      { label: 'Categorías',  icon: 'category',      route: '/inventory/categories',
        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'] },
      { label: 'Bajo stock',  icon: 'warning_amber', route: '/inventory/low-stock',
        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'] },
    ]
  },
  {
    label: 'Compras', icon: 'shopping_cart',
    roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN'],
    children: [
      { label: 'Proveedores',      icon: 'local_shipping', route: '/purchases/suppliers',
        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN'] },
      { label: 'Órdenes de compra', icon: 'receipt_long',   route: '/purchases/orders',
        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN'] },
    ]
  },
  {
    label: 'Ventas', icon: 'point_of_sale',
    roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'],
    children: [
      { label: 'Clientes',        icon: 'groups',         route: '/sales/clients',
        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'] },
      { label: 'Órdenes de venta', icon: 'receipt_long',  route: '/sales/orders',
        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'] },
      { label: 'Reservas',         icon: 'bookmark',      route: '/sales/reservations',
        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'] },
    ]
  },
  { label: 'Reportes', icon: 'bar_chart',        route: '/reports',
    roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'] },
  { label: 'Usuarios', icon: 'manage_accounts',  route: '/admin/users',
    roles: ['ROLE_ADMIN'] },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule, MatRippleModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private layoutService = inject(LayoutService);
  private authService   = inject(AuthService);
  private router        = inject(Router);
  private destroyRef    = inject(DestroyRef);

  collapsed$ = this.layoutService.collapsed$;

  navItems: NavItem[] = [];
  expandedGroups = new Set<string>();

  constructor() {
    this.buildNavItems();
    this.syncExpanded(this.router.url);

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((e: NavigationEnd) => this.syncExpanded(e.urlAfterRedirects));
  }

  private buildNavItems(): void {
    const roles = this.authService.getUserPayload()?.roles ?? [];
    this.navItems = ALL_NAV_ITEMS
      .filter(item => item.roles.some(r => roles.includes(r)))
      .map(item => ({
        ...item,
        children: item.children?.filter(c => c.roles.some(r => roles.includes(r)))
      }));
  }

  private syncExpanded(url: string): void {
    for (const item of this.navItems) {
      if (item.children?.some(c => url.startsWith(c.route))) {
        this.expandedGroups.add(item.label);
      }
    }
  }

  toggleGroup(label: string): void {
    this.expandedGroups.has(label)
      ? this.expandedGroups.delete(label)
      : this.expandedGroups.add(label);
  }

  isGroupActive(item: NavItem): boolean {
    return item.children?.some(c => this.router.url.startsWith(c.route)) ?? false;
  }

  onGroupClick(item: NavItem): void {
    if (this.layoutService.isCollapsed) {
      this.layoutService.expand();
      this.expandedGroups.add(item.label);
    } else {
      this.toggleGroup(item.label);
    }
  }

  toggle(): void {
    this.layoutService.toggle();
  }
}
