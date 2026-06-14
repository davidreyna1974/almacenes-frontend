import {
  Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SaleOrderService } from '../../services/sale-order.service';
import { ClientService } from '../../services/client.service';
import { ProductService } from '../../../inventory/services/product.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { LayoutService } from '../../../../core/layout/layout.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label.pipe';
import {
  SaleOrderDetailFormComponent,
  SaleOrderDetailFormResult,
} from '../sale-order-detail-form/sale-order-detail-form.component';
import {
  StockPreviewDialogComponent,
  StockPreviewDialogData,
  StockPreviewItem,
} from '../stock-preview-dialog/stock-preview-dialog.component';
import {
  SaleOrderResponse,
  SaleOrderDetailResponse,
  SaleOrderDetailRequest,
  SaleOrderStatus,
} from '../../models/sale-order.model';
import { ClientDTO } from '../../models/client.model';

type PendingDetailRow = SaleOrderDetailRequest & { productSku: string; productName: string };

@Component({
  selector: 'app-sale-order-detail-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatTooltipModule, MatTableModule,
    MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatProgressBarModule,
    StatusLabelPipe,
  ],
  templateUrl: './sale-order-detail-page.component.html',
  styleUrl: './sale-order-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleOrderDetailPageComponent implements OnInit {
  private orderService   = inject(SaleOrderService);
  private clientService  = inject(ClientService);
  private productService = inject(ProductService);
  private authService    = inject(AuthService);
  private layoutService  = inject(LayoutService);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private dialog         = inject(MatDialog);
  private snackBar       = inject(MatSnackBar);
  private fb             = inject(FormBuilder);
  private cdr            = inject(ChangeDetectorRef);
  private destroyRef     = inject(DestroyRef);

  order:   SaleOrderResponse | null = null;
  clients: ClientDTO[] = [];
  filteredClients: ClientDTO[] = [];
  selectedClientId: number | null = null;

  loading = false;
  isNew   = false;

  // ── Formulario de cabecera (edición / creación) ──────────────────────────
  headerForm = this.fb.group({
    clientSearch: [''],
    notes:        [''],
  });

  // ── Gestión de detalles ───────────────────────────────────────────────
  editingDetailId: number | null = null;

  // Para creación: detalles en memoria antes de crear la orden
  pendingDetailRows: PendingDetailRow[] = [];

  // ── RBAC ──────────────────────────────────────────────────────────────

  canCreateOrder(): boolean {
    return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER') || this.authService.hasRole('ROLE_SALES');
  }

  canApprove(): boolean {
    return !!this.order && this.order.status === 'PENDING'
      && (this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER'));
  }

  canDeliver(): boolean {
    return !!this.order && this.order.status === 'APPROVED'
      && (this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER') || this.authService.hasRole('ROLE_WAREHOUSEMAN'));
  }

  canCancel(): boolean {
    return !!this.order && (this.order.status === 'PENDING' || this.order.status === 'APPROVED') && this.canCreateOrder();
  }

  canEditHeader(): boolean {
    if (this.isNew) return this.canCreateOrder();
    return !!this.order && this.order.status === 'PENDING' && this.canCreateOrder();
  }

  canEditDetails(): boolean {
    return this.canEditHeader();
  }

  canSeeCost(): boolean {
    return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER');
  }

  // ── Columnas de tabla de detalles ────────────────────────────────────────

  get detailColumns(): string[] {
    const cols = ['product', 'quantity', 'unitPrice', 'subtotal'];
    if (this.canSeeCost()) cols.push('unitCost', 'margin');
    if (this.isNew) {
      cols.push('pendingActions');
    } else if (this.canEditDetails()) {
      cols.push('actions');
    }
    return cols;
  }

  get existingProductIds(): number[] {
    if (this.isNew) return this.pendingDetailRows.map(d => d.productId);
    return this.order?.details.map(d => d.productId) ?? [];
  }

  get statusHistory(): Array<{ label: string; username: string | null; at: string | null }> {
    if (!this.order) return [];
    return [
      { label: 'Aprobada',  username: this.order.approvedByUsername,  at: this.order.approvedAt },
      { label: 'Entregada', username: this.order.deliveredByUsername, at: this.order.deliveredAt },
      { label: 'Cancelada', username: this.order.cancelledByUsername, at: this.order.cancelledAt },
    ];
  }

  // ── Inicialización ────────────────────────────────────────────────────

  ngOnInit(): void {
    setTimeout(() => this.layoutService.collapse(), 0);

    const id = this.route.snapshot.paramMap.get('id');
    this.isNew = !id || id === 'new';

    this.loadClients();
    if (!this.isNew) this.loadOrder(Number(id));
  }

  private loadClients(): void {
    this.clientService.getActive('', 0, 200)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          this.clients = page.content;
          this.filteredClients = [...page.content];
          this.cdr.markForCheck();
        },
      });
  }

  private loadOrder(id: number): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.orderService.getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: order => {
          this.order = order;
          this.selectedClientId = order.clientId;
          this.headerForm.patchValue({ clientSearch: order.clientName, notes: order.notes ?? '' });
          if (order.status !== 'PENDING' || !this.canCreateOrder()) this.headerForm.disable();
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.snackBar.open(err.error?.message ?? 'Error al cargar la orden', 'Cerrar',
            { duration: 4000, panelClass: ['snackbar-error'] });
          this.loading = false;
          this.router.navigate(['/sales/orders']);
        },
      });
  }

  goBack(): void {
    const from = this.route.snapshot.queryParamMap.get('from');
    this.router.navigate(['/sales/orders'], from ? { queryParams: { tab: from } } : {});
  }

  // ── Autocomplete de cliente ──────────────────────────────────────────────

  private normalize(s: string): string {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  filterClients(term: string | unknown): void {
    if (typeof term !== 'string') return;
    const q = this.normalize(term);
    this.filteredClients = this.clients.filter(c => this.normalize(c.name).includes(q));
    this.cdr.markForCheck();
  }

  onClientSelected(client: ClientDTO): void {
    this.selectedClientId = client.id;
  }

  displayClient(clientOrStr: ClientDTO | string | null): string {
    if (!clientOrStr) return '';
    if (typeof clientOrStr === 'string') return clientOrStr;
    return clientOrStr.name;
  }

  // ── Creación de orden ─────────────────────────────────────────────────

  createOrder(): void {
    if (this.headerForm.invalid || !this.selectedClientId || this.pendingDetailRows.length === 0) return;
    const v = this.headerForm.getRawValue();
    this.loading = true;
    this.cdr.markForCheck();
    this.orderService.create({
      clientId: this.selectedClientId,
      notes:    v.notes || null,
      details:  this.pendingDetailRows.map(({ productId, quantity, unitPrice }) => ({ productId, quantity, unitPrice })),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: order => {
        this.snackBar.open('Orden creada correctamente.', 'Cerrar',
          { duration: 3000, panelClass: ['snackbar-success'] });
        this.router.navigate(['/sales/orders', order.id]);
      },
      error: err => {
        this.snackBar.open(err.error?.message ?? 'Error al crear la orden', 'Cerrar',
          { duration: 4000, panelClass: ['snackbar-error'] });
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ── Edición de cabecera (L25) ─────────────────────────────────────────

  saveHeader(): void {
    if (!this.order || this.headerForm.invalid || !this.selectedClientId) return;
    const v = this.headerForm.getRawValue();
    this.loading = true;
    this.cdr.markForCheck();
    this.orderService.update(this.order.id, { clientId: this.selectedClientId, notes: v.notes || null })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: order => {
          this.order = order;
          this.headerForm.markAsPristine();
          this.snackBar.open('Orden actualizada.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.snackBar.open(err.error?.message ?? 'Error al actualizar', 'Cerrar',
            { duration: 4000, panelClass: ['snackbar-error'] });
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  // ── Transiciones de estado ────────────────────────────────────────────

  approve(): void {
    if (!this.order || this.order.details.length === 0) {
      this.snackBar.open('La orden no tiene líneas de detalle.', 'Cerrar',
        { duration: 4000, panelClass: ['snackbar-error'] });
      return;
    }
    const order = this.order;
    this.loadStockPreview(order.details, 'available')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(items => {
        const data: StockPreviewDialogData = {
          title:          'Aprobar orden',
          message:        `¿Aprobar la orden ${order.orderNumber}? Se reservará el stock de los productos solicitados.`,
          availableLabel: 'Disponible',
          items,
          confirmLabel:   'Aprobar',
        };
        this.dialog.open(StockPreviewDialogComponent, { data, width: '520px', disableClose: true })
          .afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
            if (!ok) return;
            this.runTransition(() => this.orderService.approve(order.id), 'Orden aprobada correctamente.');
          });
      });
  }

  deliver(): void {
    if (!this.order) return;
    const order = this.order;
    this.loadStockPreview(order.details, 'current')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(items => {
        const data: StockPreviewDialogData = {
          title:          'Entregar orden',
          message:        `¿Confirmar la entrega de la orden ${order.orderNumber}? Se descontará el stock físico de los productos.`,
          availableLabel: 'Stock físico',
          items,
          confirmLabel:   'Entregar',
        };
        this.dialog.open(StockPreviewDialogComponent, { data, width: '520px', disableClose: true })
          .afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
            if (!ok) return;
            this.runTransition(() => this.orderService.deliver(order.id), 'Orden entregada correctamente.');
          });
      });
  }

  cancel(): void {
    if (!this.order) return;
    const order = this.order;
    const message = order.status === 'APPROVED'
      ? `¿Cancelar la orden ${order.orderNumber}? Esta acción liberará la reserva de stock. Es irreversible.`
      : `¿Cancelar la orden ${order.orderNumber}? Esta acción es irreversible.`;
    const data: ConfirmDialogData = {
      title:        'Cancelar orden',
      message,
      confirmLabel: 'Cancelar orden',
      dangerous:    true,
    };
    this.dialog.open(ConfirmDialogComponent, { data, width: '480px', disableClose: true })
      .afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
        if (!ok) return;
        this.runTransition(() => this.orderService.cancel(order.id), 'Orden cancelada correctamente.');
      });
  }

  // Construye el preview de stock por línea (R4/R7) — un único 404/500 aislado
  // no debe romper el preview completo (L33): se trata como producto sin datos.
  private loadStockPreview(
    details: SaleOrderDetailResponse[],
    field: 'available' | 'current',
  ): Observable<StockPreviewItem[]> {
    return forkJoin(
      details.map(d => this.productService.getById(d.productId).pipe(catchError(() => of(null)))),
    ).pipe(
      map(products => details.map((d, i) => {
        const product = products[i];
        const available = product
          ? (field === 'available' ? product.availableStock : product.currentStock)
          : 0;
        return {
          productSku:  d.productSku,
          productName: d.productName,
          quantity:    d.quantity,
          available,
        };
      })),
    );
  }

  private runTransition(op: () => Observable<SaleOrderResponse>, msg: string): void {
    this.loading = true;
    this.cdr.markForCheck();
    op().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: order => {
        this.order = order;
        this.snackBar.open(msg, 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
        this.headerForm.disable();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.snackBar.open(err.error?.message ?? 'Error en la operación', 'Cerrar',
          { duration: 5000, panelClass: ['snackbar-error'] });
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ── Gestión de detalles ───────────────────────────────────────────────

  openAddDetail(): void {
    this.editingDetailId = null;
    this.dialog.open(SaleOrderDetailFormComponent, {
      data: { detail: null, existingProductIds: this.existingProductIds },
      width: '520px',
      disableClose: true,
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) this.handleDetailResult(result);
    });
  }

  openEditDetail(detail: SaleOrderDetailResponse): void {
    this.editingDetailId = detail.id;
    this.dialog.open(SaleOrderDetailFormComponent, {
      data: { detail, existingProductIds: this.existingProductIds },
      width: '520px',
      disableClose: true,
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) this.handleDetailResult(result);
    });
  }

  private handleDetailResult(result: SaleOrderDetailFormResult): void {
    if (this.isNew) {
      if (result.mode === 'create') {
        this.pendingDetailRows = [...this.pendingDetailRows, {
          ...result.dto,
          productSku:  result.productSku,
          productName: result.productName,
        }];
        this.cdr.markForCheck();
      }
      return;
    }

    if (!this.order) return;
    this.loading = true;
    this.cdr.markForCheck();

    const op$ = result.mode === 'edit'
      ? this.orderService.updateDetail(this.order.id, this.editingDetailId!, result.dto)
      : this.orderService.addDetail(this.order.id, result.dto);

    const successMsg = result.mode === 'edit' ? 'Línea actualizada.' : 'Línea agregada.';

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: order => {
        this.order = order;
        this.editingDetailId = null;
        this.snackBar.open(successMsg, 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.snackBar.open(err.error?.message ?? 'Error al guardar la línea', 'Cerrar',
          { duration: 4000, panelClass: ['snackbar-error'] });
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  removePendingDetail(row: PendingDetailRow): void {
    this.pendingDetailRows = this.pendingDetailRows.filter(r => r !== row);
    this.cdr.markForCheck();
  }

  removeDetail(detail: SaleOrderDetailResponse): void {
    if (!this.order) return;
    if (this.order.details.length <= 1) {
      this.snackBar.open('No se puede eliminar la única línea. Una orden debe tener al menos un producto.', 'Cerrar',
        { duration: 4000, panelClass: ['snackbar-error'] });
      return;
    }
    const order = this.order;
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar línea', message: `¿Eliminar "${detail.productName}" de la orden?`, confirmLabel: 'Eliminar', dangerous: true },
      width: '480px',
      disableClose: true,
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
      if (!ok) return;
      this.loading = true;
      this.cdr.markForCheck();
      this.orderService.removeDetail(order.id, detail.id)
        .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => this.loadOrder(order.id),
          error: err => {
            this.snackBar.open(err.error?.message ?? 'Error al eliminar línea', 'Cerrar',
              { duration: 4000, panelClass: ['snackbar-error'] });
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
    });
  }

  // ── Helpers de presentación ───────────────────────────────────────────

  getStatusClass(status: SaleOrderStatus): string {
    const map: Record<SaleOrderStatus, string> = {
      PENDING:   'status--pending',
      APPROVED:  'status--approved',
      DELIVERED: 'status--delivered',
      CANCELLED: 'status--cancelled',
    };
    return map[status] ?? '';
  }

  margin(detail: SaleOrderDetailResponse): number | null {
    if (detail.unitCost == null) return null;
    return detail.unitPrice - detail.unitCost;
  }
}
