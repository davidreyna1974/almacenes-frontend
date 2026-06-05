import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { LayoutService } from '../layout.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule, MatRippleModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private layoutService = inject(LayoutService);
  collapsed$ = this.layoutService.collapsed$;

  // Estructura preparada para filtrado por rol en Módulo 1
  navItems: NavItem[] = [
    { label: 'Inventario', icon: 'inventory_2',     route: '/inventory',
      roles: ['ROLE_ADMIN','ROLE_MANAGER','ROLE_WAREHOUSEMAN','ROLE_SALES'] },
    { label: 'Compras',    icon: 'shopping_cart',   route: '/purchases',
      roles: ['ROLE_ADMIN','ROLE_MANAGER','ROLE_WAREHOUSEMAN'] },
    { label: 'Ventas',     icon: 'point_of_sale',   route: '/sales',
      roles: ['ROLE_ADMIN','ROLE_MANAGER','ROLE_SALES'] },
    { label: 'Reportes',   icon: 'bar_chart',       route: '/reports',
      roles: ['ROLE_ADMIN','ROLE_MANAGER','ROLE_WAREHOUSEMAN','ROLE_SALES'] },
    { label: 'Usuarios',   icon: 'manage_accounts', route: '/admin/users',
      roles: ['ROLE_ADMIN'] },
  ];

  toggle(): void {
    this.layoutService.toggle();
  }
}
