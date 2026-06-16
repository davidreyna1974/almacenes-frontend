import { Component, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { LayoutService } from '../layout.service';
import { AuthService } from '../../auth/auth.service';

const BREADCRUMB_MAP: { path: string; label: string }[] = [
  { path: '/inventory/products',   label: 'Inventario → Productos'   },
  { path: '/inventory/categories', label: 'Inventario → Categorías'  },
  { path: '/inventory/low-stock',  label: 'Inventario → Bajo stock'  },
  { path: '/purchases/suppliers',  label: 'Compras → Proveedores'        },
  { path: '/purchases/orders/new', label: 'Compras → Nueva orden'        },
  { path: '/purchases/orders',     label: 'Compras → Órdenes de compra'  },
  { path: '/sales/clients',        label: 'Ventas → Clientes'            },
  { path: '/sales/orders/new',     label: 'Ventas → Nueva orden'         },
  { path: '/sales/orders/',        label: 'Ventas → Detalle de orden'    },
  { path: '/sales/orders',         label: 'Ventas → Órdenes de venta'    },
  { path: '/sales/reservations',   label: 'Ventas → Reservas de stock'   },
  { path: '/reports/executive',   label: 'Reportes → Dashboard Ejecutivo' },
  { path: '/reports/analytics',   label: 'Reportes → Dashboard Analítico' },
  { path: '/reports/operational', label: 'Reportes → Operativo'           },
  { path: '/reports/pending',     label: 'Reportes → Pendientes'          },
  { path: '/reports',             label: 'Reportes'                       },
  { path: '/admin/users',          label: 'Usuarios'                },
];

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  private layoutService = inject(LayoutService);
  private authService   = inject(AuthService);
  private router        = inject(Router);
  private destroyRef    = inject(DestroyRef);

  breadcrumb = '';

  constructor() {
    this.updateBreadcrumb(this.router.url);

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((e: NavigationEnd) => this.updateBreadcrumb(e.urlAfterRedirects));
  }

  private updateBreadcrumb(url: string): void {
    const path  = url.split('?')[0];
    const match = BREADCRUMB_MAP.find(b => path.startsWith(b.path));
    this.breadcrumb = match?.label ?? '';
  }

  get userName(): string { return this.authService.getUsername(); }
  get userRole(): string { return this.authService.getPrimaryRole(); }

  toggle(): void { this.layoutService.toggle(); }
  logout(): void { this.authService.logout(); }

  getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      ADMIN:        'var(--color-role-admin)',
      MANAGER:      'var(--color-role-manager)',
      WAREHOUSEMAN: 'var(--color-role-warehouseman)',
      SALES:        'var(--color-role-sales)',
    };
    return colors[role] ?? 'var(--color-text-secondary)';
  }
}
