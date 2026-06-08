import {
  Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PurchaseOrderService } from '../../services/purchase-order.service';
import { SupplierService } from '../../services/supplier.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { LayoutService } from '../../../../core/layout/layout.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PurchaseOrderDetailFormComponent } from '../purchase-order-detail-form/purchase-order-detail-form.component';
import {
  PurchaseOrderResponse,
  PurchaseOrderDetailResponse,
  PurchaseOrderDetailRequest,
  PurchaseOrderDetailUpdateRequest,
  PurchaseOrderStatus,
} from '../../models/purchase-order.model';
import { SupplierDTO } from '../../models/supplier.model';

@Component({
  selector: 'app-purchase-order-detail-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatTooltipModule, MatTableModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule,
    PurchaseOrderDetailFormComponent,
  ],
  templateUrl: './purchase-order-detail-page.component.html',
  styleUrl: './purchase-order-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderDetailPageComponent implements OnInit {
  private orderService   = inject(PurchaseOrderService);
  private supplierService = inject(SupplierService);
  private authService    = inject(AuthService);
  private layoutService  = inject(LayoutService);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private dialog         = inject(MatDialog);
  private snackBar       = inject(MatSnackBar);
  private fb             = inject(FormBuilder);
  private cdr            = inject(ChangeDetectorRef);
  private destroyRef     = inject(DestroyRef);

  order:     PurchaseOrderResponse | null = null;
  suppliers: SupplierDTO[] = [];
  loading  = false;
  isNew    = false;

  // formulario de cabecera (edición / creación)
  headerForm = this.fb.group({
    supplierId: [null as number | null, Validators.required],
    notes:      [''],
  });

  // gestión de detalles
  showDetailForm  = false;
  editingDetail:  PurchaseOrderDetailResponse | null = null;
  detailColumns   = ['productSku', 'productName', 'quantity', 'unitPrice', 'subtotal', 'actions'];

  canWrite():      boolean { return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER'); }
  canReceiveOrd(): boolean { return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER') || this.authService.hasRole('ROLE_WAREHOUSEMAN'); }
  canSeePrices():  boolean { return this.canWrite(); }

  canApprove():     boolean { return !!this.order && this.order.status === 'PENDING' && this.canWrite(); }
  canReceive():     boolean { return !!this.order && this.order.status === 'APPROVED' && this.canReceiveOrd(); }
  canCancel():      boolean { return !!this.order && (this.order.status === 'PENDING' || this.order.status === 'APPROVED') && this.canWrite(); }
  canEditHeader():  boolean { return !!this.order && this.order.status === 'PENDING' && this.canWrite(); }
  canEditDetails(): boolean { return !!this.order && this.order.status === 'PENDING' && this.canWrite(); }

  get existingProductIds(): number[] {
    if (this.isNew) return this.pendingDetails.map(d => d.productId);
    return this.order?.details.map(d => d.productId) ?? [];
  }

  get detailColumnsForRole(): string[] {
    if (!this.canSeePrices()) return ['productSku', 'productName', 'quantity'];
    if (this.isNew) return ['productSku', 'productName', 'quantity', 'unitPrice', 'subtotal', 'pendingActions'];
    return this.detailColumns;
  }

  ngOnInit(): void {
    setTimeout(() => this.layoutService.collapse(), 0);
    const id = this.route.snapshot.paramMap.get('id');
    this.isNew = !id || id === 'new';

    this.loadSuppliers();
    if (!this.isNew) this.loadOrder(Number(id));
  }

  private loadSuppliers(): void {
    this.supplierService.getActive(0, 200)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: page => { this.suppliers = page.content; this.cdr.markForCheck(); } });
  }

  private loadOrder(id: number): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.orderService.getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: order => {
          this.order = order;
          this.headerForm.patchValue({ supplierId: order.supplierId, notes: order.notes ?? '' });
          if (order.status !== 'PENDING' || !this.canWrite()) this.headerForm.disable();
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.snackBar.open(err.error?.message ?? 'Error al cargar la orden', 'Cerrar',
            { duration: 4000, panelClass: 'snackbar-error' });
          this.loading = false;
          this.router.navigate(['/purchases/orders']);
        },
      });
  }

  goBack(): void {
    const from = this.route.snapshot.queryParamMap.get('from');
    this.router.navigate(['/purchases/orders'], from ? { queryParams: { tab: from } } : {});
  }

  // ── Creación de orden ─────────────────────────────────────────────────

  createOrder(): void {
    if (this.headerForm.invalid || this.pendingDetails.length === 0) return;
    const v = this.headerForm.getRawValue();
    this.loading = true;
    this.cdr.markForCheck();
    this.orderService.create({
      supplierId: v.supplierId!,
      notes:      v.notes || null,
      details:    this.pendingDetails,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: order => {
        this.snackBar.open('Orden creada correctamente.', 'Cerrar',
          { duration: 3000, panelClass: 'snackbar-success' });
        this.router.navigate(['/purchases/orders', order.id]);
      },
      error: err => {
        this.snackBar.open(err.error?.message ?? 'Error al crear la orden', 'Cerrar',
          { duration: 4000, panelClass: 'snackbar-error' });
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ── Edición de cabecera ───────────────────────────────────────────────

  saveHeader(): void {
    if (!this.order || this.headerForm.invalid) return;
    const v = this.headerForm.getRawValue();
    this.loading = true;
    this.cdr.markForCheck();
    this.orderService.update(this.order.id, { supplierId: v.supplierId!, notes: v.notes || null })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: order => {
          this.order = order;
          this.headerForm.markAsPristine();
          this.snackBar.open('Orden actualizada.', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.snackBar.open(err.error?.message ?? 'Error al actualizar', 'Cerrar',
            { duration: 4000, panelClass: 'snackbar-error' });
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  // ── Transiciones de estado ────────────────────────────────────────────

  approve(): void {
    if (!this.order || !this.order.details.length) {
      this.snackBar.open('La orden no tiene líneas de detalle.', 'Cerrar',
        { duration: 4000, panelClass: 'snackbar-error' });
      return;
    }
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Aprobar orden', message: `¿Aprobar la orden ${this.order.orderNumber}? Los detalles quedarán bloqueados.`, confirmLabel: 'Aprobar' },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
      if (!ok) return;
      this.runTransition(() => this.orderService.approve(this.order!.id), 'Orden aprobada.');
    });
  }

  receive(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Recibir mercancía', message: `¿Confirmar recepción? Se incrementará el stock de todos los productos de la orden.`, confirmLabel: 'Recibir' },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
      if (!ok) return;
      this.runTransition(() => this.orderService.receive(this.order!.id), 'Mercancía recibida. Stock actualizado.');
    });
  }

  cancel(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Cancelar orden', message: `¿Cancelar la orden ${this.order!.orderNumber}? Esta acción es irreversible.`, confirmLabel: 'Cancelar orden', confirmColor: 'warn' },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
      if (!ok) return;
      this.runTransition(() => this.orderService.cancel(this.order!.id), 'Orden cancelada.');
    });
  }

  private runTransition(op: () => import('rxjs').Observable<PurchaseOrderResponse>, msg: string): void {
    this.loading = true;
    this.cdr.markForCheck();
    op().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: order => {
        this.order = order;
        this.snackBar.open(msg, 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
        this.headerForm.disable();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.snackBar.open(err.error?.message ?? 'Error en la operación', 'Cerrar',
          { duration: 5000, panelClass: 'snackbar-error' });
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ── Gestión de detalles ───────────────────────────────────────────────

  // Para creación: detalles en memoria antes de crear la orden
  pendingDetails: PurchaseOrderDetailRequest[] = [];
  pendingDetailRows: Array<PurchaseOrderDetailRequest & { productName?: string; productSku?: string }> = [];

  openAddDetail(): void {
    this.editingDetail = null;
    this.showDetailForm = true;
    this.cdr.markForCheck();
  }

  openEditDetail(detail: PurchaseOrderDetailResponse): void {
    this.editingDetail  = detail;
    this.showDetailForm = true;
    this.cdr.markForCheck();
  }

  removePendingDetail(row: PurchaseOrderDetailRequest & { productName?: string; productSku?: string }): void {
    const idx = this.pendingDetailRows.indexOf(row);
    if (idx !== -1) {
      this.pendingDetailRows = this.pendingDetailRows.filter((_, i) => i !== idx);
      this.pendingDetails    = this.pendingDetails.filter((_, i) => i !== idx);
      this.cdr.markForCheck();
    }
  }

  onDetailSave(dto: PurchaseOrderDetailRequest | PurchaseOrderDetailUpdateRequest): void {
    if (this.isNew) {
      // Orden aún no creada — guardar en memoria
      this.pendingDetails = [...this.pendingDetails, dto as PurchaseOrderDetailRequest];
      this.pendingDetailRows = [...this.pendingDetailRows, dto as any];
      this.showDetailForm = false;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();
    const op$ = this.editingDetail
      ? this.orderService.updateDetail(this.order!.id, this.editingDetail.id, dto as PurchaseOrderDetailUpdateRequest)
      : this.orderService.addDetail(this.order!.id, dto as PurchaseOrderDetailRequest);

    const wasEditing = !!this.editingDetail;
    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: order => {
        this.order = order;
        this.showDetailForm = false;
        this.editingDetail  = null;
        this.snackBar.open(
          wasEditing ? 'Línea actualizada.' : 'Línea agregada.',
          'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.snackBar.open(err.error?.message ?? 'Error al guardar la línea', 'Cerrar',
          { duration: 4000, panelClass: 'snackbar-error' });
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  removeDetail(detail: PurchaseOrderDetailResponse): void {
    if ((this.order?.details.length ?? 0) <= 1) {
      this.snackBar.open('No se puede eliminar la única línea. Una orden debe tener al menos un producto.', 'Cerrar',
        { duration: 4000, panelClass: ['snackbar-error'] });
      return;
    }
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar línea', message: `¿Eliminar "${detail.productName}" de la orden?`, confirmLabel: 'Eliminar', confirmColor: 'warn' },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
      if (!ok) return;
      this.loading = true;
      this.cdr.markForCheck();
      this.orderService.removeDetail(this.order!.id, detail.id)
        .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => { this.loadOrder(this.order!.id); },
          error: err => {
            this.snackBar.open(err.error?.message ?? 'Error al eliminar línea', 'Cerrar',
              { duration: 4000, panelClass: 'snackbar-error' });
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
    });
  }

  getStatusLabel(status: PurchaseOrderStatus): string {
    const m: Record<PurchaseOrderStatus, string> = {
      PENDING: 'Pendiente', APPROVED: 'Aprobada', RECEIVED: 'Recibida', CANCELLED: 'Cancelada',
    };
    return m[status] ?? status;
  }

  getStatusClass(status: PurchaseOrderStatus): string {
    return {
      PENDING: 'status--pending', APPROVED: 'status--approved',
      RECEIVED: 'status--received', CANCELLED: 'status--cancelled',
    }[status] ?? '';
  }
}
