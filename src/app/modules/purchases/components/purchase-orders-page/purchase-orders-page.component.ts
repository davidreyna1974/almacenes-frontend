import {
  Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PurchaseOrderService } from '../../services/purchase-order.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { LayoutService } from '../../../../core/layout/layout.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PurchaseOrderResponse, PurchaseOrderStatus } from '../../models/purchase-order.model';
import { PageResponse } from '../../../../shared/models/page-response.model';

type TabStatus = PurchaseOrderStatus;

@Component({
  selector: 'app-purchase-orders-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTabsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatTooltipModule, MatProgressBarModule, MatPaginatorModule, MatChipsModule,
    MatFormFieldModule, MatInputModule,
  ],
  templateUrl: './purchase-orders-page.component.html',
  styleUrl: './purchase-orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrdersPageComponent implements OnInit {
  private orderService = inject(PurchaseOrderService);
  private authService  = inject(AuthService);
  private layoutService = inject(LayoutService);
  private router       = inject(Router);
  private dialog       = inject(MatDialog);
  private snackBar     = inject(MatSnackBar);
  private cdr          = inject(ChangeDetectorRef);
  private destroyRef   = inject(DestroyRef);

  readonly tabs: { status: TabStatus; label: string }[] = [
    { status: 'PENDING',   label: 'Pendientes'  },
    { status: 'APPROVED',  label: 'Aprobadas'   },
    { status: 'RECEIVED',  label: 'Recibidas'   },
    { status: 'CANCELLED', label: 'Canceladas'  },
  ];

  pages:  Map<TabStatus, PageResponse<PurchaseOrderResponse>> = new Map();
  counts: Map<TabStatus, number> = new Map();
  private pendingRequests = 0;
  get loading(): boolean { return this.pendingRequests > 0; }
  activeTab: TabStatus = 'PENDING';
  displayedColumns: string[] = [];
  searchCtrl = new FormControl('');
  filteredOrders: PurchaseOrderResponse[] = [];

  canWrite():      boolean { return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER'); }
  canReceiveOrd(): boolean { return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER') || this.authService.hasRole('ROLE_WAREHOUSEMAN'); }
  canSeePrices():  boolean { return this.canWrite(); }

  get currentPage(): PageResponse<PurchaseOrderResponse> | null {
    return this.pages.get(this.activeTab) ?? null;
  }

  get orders(): PurchaseOrderResponse[] {
    return this.currentPage?.content ?? [];
  }

  private normalize(s: string): string {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  private applySearch(term: string): void {
    const q = this.normalize(term.trim());
    const src = this.currentPage?.content ?? [];
    this.filteredOrders = q
      ? src.filter(o =>
          this.normalize(o.orderNumber).includes(q) ||
          this.normalize(o.supplierName).includes(q) ||
          this.normalize(o.createdByUsername).includes(q))
      : [...src];
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    setTimeout(() => this.layoutService.collapse(), 0);
    const cols = ['orderNumber', 'supplierName', 'createdByUsername', 'createdAt', 'status', 'actions'];
    if (this.canSeePrices()) cols.splice(2, 0, 'totalAmount');
    this.displayedColumns = cols;

    this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(q => this.applySearch(q ?? ''));

    // Carga completa de la tab activa + conteos de las demás
    this.loadTab('PENDING');
    for (const tab of this.tabs) {
      if (tab.status !== 'PENDING') this.loadCount(tab.status);
    }
  }

  loadTab(status: TabStatus, page = 0, size = 20): void {
    this.pendingRequests++;
    this.cdr.markForCheck();
    this.orderService.getByStatus(status, page, size)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: pageData => {
          this.pages.set(status, pageData);
          this.pendingRequests--;
          this.applySearch(this.searchCtrl.value ?? '');
        },
        error: err => {
          this.snackBar.open(err.error?.message ?? 'Error al cargar órdenes', 'Cerrar',
            { duration: 4000, panelClass: ['snackbar-error'] });
          this.pendingRequests--;
          this.cdr.markForCheck();
        },
      });
  }

  private loadCount(status: TabStatus): void {
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
    this.searchCtrl.setValue('', { emitEvent: false });
    if (!this.pages.has(this.activeTab)) {
      this.loadTab(this.activeTab);
    } else {
      this.applySearch('');
    }
  }

  onPage(event: PageEvent): void {
    this.loadTab(this.activeTab, event.pageIndex, event.pageSize);
  }

  countFor(status: TabStatus): number {
    return this.counts.get(status) ?? this.pages.get(status)?.totalElements ?? 0;
  }

  viewDetail(order: PurchaseOrderResponse): void {
    this.router.navigate(['/purchases/orders', order.id]);
  }

  newOrder(): void {
    this.router.navigate(['/purchases/orders/new']);
  }

  approve(order: PurchaseOrderResponse): void {
    if (order.details.length === 0) {
      this.snackBar.open('No se puede aprobar una orden sin líneas de detalle.', 'Cerrar',
        { duration: 4000, panelClass: 'snackbar-error' });
      return;
    }
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Aprobar orden',
        message: `¿Aprobar la orden ${order.orderNumber}? Los detalles quedarán bloqueados.`,
        confirmLabel: 'Aprobar',
      },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
      if (!ok) return;
      this.executeTransition(() => this.orderService.approve(order.id),
        'Orden aprobada.', 'APPROVED');
    });
  }

  receive(order: PurchaseOrderResponse): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Recibir mercancía',
        message: `¿Confirmar recepción de la orden ${order.orderNumber}? Se incrementará el stock de todos los productos.`,
        confirmLabel: 'Recibir',
      },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
      if (!ok) return;
      this.executeTransition(() => this.orderService.receive(order.id),
        'Mercancía recibida. Stock actualizado.', 'RECEIVED');
    });
  }

  cancel(order: PurchaseOrderResponse): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar orden',
        message: `¿Cancelar la orden ${order.orderNumber}? Esta acción es irreversible.`,
        confirmLabel: 'Cancelar orden',
        confirmColor: 'warn',
      },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
      if (!ok) return;
      this.executeTransition(() => this.orderService.cancel(order.id),
        'Orden cancelada.', 'CANCELLED');
    });
  }

  private executeTransition(
    op: () => import('rxjs').Observable<PurchaseOrderResponse>,
    successMsg: string,
    reloadTab: TabStatus,
  ): void {
    this.pendingRequests++;
    this.cdr.markForCheck();
    op().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.pendingRequests--;
        this.snackBar.open(successMsg, 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
        this.pages.clear();
        this.counts.clear();
        this.activeTab = reloadTab;
        this.searchCtrl.setValue('', { emitEvent: false });
        this.loadTab(this.activeTab);
        for (const tab of this.tabs) {
          if (tab.status !== this.activeTab) this.loadCount(tab.status);
        }
      },
      error: err => {
        this.snackBar.open(err.error?.message ?? 'No se pudo completar la operación', 'Cerrar',
          { duration: 5000, panelClass: ['snackbar-error'] });
        this.pendingRequests--;
        this.cdr.markForCheck();
      },
    });
  }

  getStatusLabel(status: PurchaseOrderStatus): string {
    const map: Record<PurchaseOrderStatus, string> = {
      PENDING:   'Pendiente',
      APPROVED:  'Aprobada',
      RECEIVED:  'Recibida',
      CANCELLED: 'Cancelada',
    };
    return map[status] ?? status;
  }

  getStatusClass(status: PurchaseOrderStatus): string {
    const map: Record<PurchaseOrderStatus, string> = {
      PENDING:   'status--pending',
      APPROVED:  'status--approved',
      RECEIVED:  'status--received',
      CANCELLED: 'status--cancelled',
    };
    return map[status] ?? '';
  }
}
