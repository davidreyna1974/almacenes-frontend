import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { map } from 'rxjs/operators';
import { combineLatest, interval, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { LayoutService } from '../layout.service';
import { AuthService } from '../../auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  { label: 'Inventario', icon: 'inventory_2',     route: '/inventory',
    roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'] },
  { label: 'Compras',    icon: 'shopping_cart',   route: '/purchases',
    roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN'] },
  { label: 'Ventas',     icon: 'point_of_sale',   route: '/sales',
    roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'] },
  { label: 'Reportes',   icon: 'bar_chart',       route: '/reports',
    roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'] },
  { label: 'Usuarios',   icon: 'manage_accounts', route: '/admin/users',
    roles: ['ROLE_ADMIN'] },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [AsyncPipe, RouterModule, MatIconModule, MatTooltipModule, MatRippleModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private layoutService = inject(LayoutService);
  private authService = inject(AuthService);

  collapsed$ = this.layoutService.collapsed$;

  // Re-evalúa los ítems cada vez que el componente se suscribe (roles vienen del token)
  navItems$ = of(null).pipe(
    map(() => {
      const roles = this.authService.getUserPayload()?.roles ?? [];
      return ALL_NAV_ITEMS.filter(item =>
        item.roles.some(r => roles.includes(r))
      );
    })
  );

  toggle(): void {
    this.layoutService.toggle();
  }
}
