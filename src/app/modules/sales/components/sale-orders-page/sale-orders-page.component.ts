import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SaleOrderService } from '../../services/sale-order.service';
import { SaleOrderResponse, SaleOrderStatus } from '../../models/sale-order.model';
import { PageResponse } from '../../../../shared/models/page-response.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { LayoutService } from '../../../../core/layout/layout.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label.pipe';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-sale-orders-page',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    EmptyStateComponent,
    StatusLabelPipe,
  ],
  templateUrl: './sale-orders-page.component.html',
  styleUrl: './sale-orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleOrdersPageComponent implements OnInit {
  private orderService  = inject(SaleOrderService);
  private authService   = inject(AuthService);
  private layoutService = inject(LayoutService);
  private route         = inject(ActivatedRoute);
  private router        = inject(Router);
  private dialog        = inject(MatDialog);
  private snackBar      = inject(MatSnackBar);
  private destroyRef    = inject(DestroyRef);
  private cdr           = inject(ChangeDetectorRef);

  readonly tabs: { status: SaleOrderStatus; label: string }[] = [
    { status: 'PENDING',   label: 'Pendientes' },
    { status: 'APPROVED',  label: 'Aprobadas'  },
    { status: 'DELIVERED', label: 'Entregadas' },
    { status: 'CANCELLED', label: 'Canceladas' },
  ];

  readonly displayedColumns = [
    'orderNumber', 'clientName', 'totalAmount', 'createdByUsername', 'createdAt', 'status', 'actions',
  ];

  pages:  Map<SaleOrderStatus, PageResponse<SaleOrderResponse>> = new Map();
  counts: Map<SaleOrderStatus, number> = new Map();
  activeTab: SaleOrderStatus = 'PENDING';
  pageSize = 20;

  private pendingRequests = 0;
  get loading(): boolean { return this.pendingRequests > 0; }

  canCreateOrder(): boolean {
    return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER') || this.authService.hasRole('ROLE_SALES');
  }

  canEditOrder(order: SaleOrderResponse): boolean {
    return this.canCreateOrder() && order.status === 'PENDING';
  }

  canApprove(order: SaleOrderResponse): boolean {
    return (this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER')) && order.status === 'PENDING';
  }

  canDeliver(order: SaleOrderResponse): boolean {
    return (this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER') || this.authService.hasRole('ROLE_WAREHOUSEMAN'))
      && order.status === 'APPROVED';
  }

  canCancel(order: SaleOrderResponse): boolean {
    return this.canCreateOrder() && (order.status === 'PENDING' || order.status === 'APPROVED');
  }

  get activeTabIndex(): number {
    return this.tabs.findIndex(t => t.status === this.activeTab);
  }

  get activeTabLabel(): string {
    return this.tabs[this.activeTabIndex]?.label ?? '';
  }

  get currentPage(): PageResponse<SaleOrderResponse> | null {
    return this.pages.get(this.activeTab) ?? null;
  }

  get orders(): SaleOrderResponse[] {
    return this.currentPage?.content ?? [];
  }

  countFor(status: SaleOrderStatus): number {
    return this.counts.get(status) ?? this.pages.get(status)?.totalElements ?? 0;
  }

  ngOnInit(): void {
    setTimeout(() => this.layoutService.collapse(), 0);

    const tabParam = this.route.snapshot.queryParamMap.get('tab') as SaleOrderStatus | null;
    if (tabParam && this.tabs.some(t => t.status === tabParam)) {
      this.activeTab = tabParam;
    }

    this.loadTab(this.activeTab, 0);
    for (const tab of this.tabs) {
      if (tab.status !== this.activeTab) this.loadCount(tab.status);
    }
  }

  loadTab(status: SaleOrderStatus, page: number, size = this.pageSize): void {
    this.pendingRequests++;
    this.cdr.markForCheck();
    this.orderService.getByStatus(status, page, size)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: pageData => {
          this.pages.set(status, pageData);
          this.pendingRequests--;
          this.cdr.markForCheck();
        },
        error: err => {
          this.snackBar.open(err.error?.message ?? 'Error al cargar órdenes de venta.', 'Cerrar',
            { duration: 4000, panelClass: ['snackbar-error'] });
          this.pendingRequests--;
          this.cdr.markForCheck();
        },
      });
  }

  private loadCount(status: SaleOrderStatus): void {
    this.orderService.getByStatus(status, 0, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: pageData => {
          this.counts.set(status, pageData.totalElements);
          this.cdr.markForCheck();
        },
      });
  }

  onTabChange(index: number): void {
    this.activeTab = this.tabs[index].status;
    this.loadTab(this.activeTab, 0);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.loadTab(this.activeTab, event.pageIndex, event.pageSize);
  }

  openDetail(order: SaleOrderResponse): void {
    this.router.navigate(['/sales/orders', order.id], { queryParams: { from: this.activeTab } });
  }

  newOrder(): void {
    this.router.navigate(['/sales/orders/new']);
  }

  approveOrder(order: SaleOrderResponse): void {
    const data: ConfirmDialogData = {
      title:        'Aprobar orden',
      message:      `¿Aprobar la orden ${order.orderNumber}? Se reservará el stock de los productos solicitados.`,
      confirmLabel: 'Aprobar',
    };
    this.confirmAndTransition(data, () => this.orderService.approve(order.id), 'Orden aprobada correctamente.');
  }

  deliverOrder(order: SaleOrderResponse): void {
    const data: ConfirmDialogData = {
      title:        'Entregar orden',
      message:      `¿Confirmar la entrega de la orden ${order.orderNumber}? Se descontará el stock físico de los productos.`,
      confirmLabel: 'Entregar',
    };
    this.confirmAndTransition(data, () => this.orderService.deliver(order.id), 'Orden entregada correctamente.');
  }

  cancelOrder(order: SaleOrderResponse): void {
    const message = order.status === 'APPROVED'
      ? `¿Cancelar la orden ${order.orderNumber}? Esta acción liberará la reserva de stock. Es irreversible.`
      : `¿Cancelar la orden ${order.orderNumber}? Esta acción es irreversible.`;
    const data: ConfirmDialogData = {
      title:        'Cancelar orden',
      message,
      confirmLabel: 'Cancelar orden',
      dangerous:    true,
    };
    this.confirmAndTransition(data, () => this.orderService.cancel(order.id), 'Orden cancelada correctamente.');
  }

  private confirmAndTransition(
    data: ConfirmDialogData,
    op: () => Observable<SaleOrderResponse>,
    successMsg: string,
  ): void {
    this.dialog.open(ConfirmDialogComponent, { data, width: '480px', disableClose: true })
      .afterClosed()
      .pipe(
        filter(r => r === true),
        switchMap(() => op()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.snackBar.open(successMsg, 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
          this.reloadAll();
        },
        error: err => {
          this.snackBar.open(err.error?.message ?? 'No se pudo completar la operación.', 'Cerrar',
            { duration: 5000, panelClass: ['snackbar-error'] });
        },
      });
  }

  private reloadAll(): void {
    this.pages.clear();
    this.counts.clear();
    this.loadTab(this.activeTab, 0);
    for (const tab of this.tabs) {
      if (tab.status !== this.activeTab) this.loadCount(tab.status);
    }
  }

  getStatusClass(status: SaleOrderStatus): string {
    const map: Record<SaleOrderStatus, string> = {
      PENDING:   'status--pending',
      APPROVED:  'status--approved',
      DELIVERED: 'status--delivered',
      CANCELLED: 'status--cancelled',
    };
    return map[status] ?? '';
  }
}
