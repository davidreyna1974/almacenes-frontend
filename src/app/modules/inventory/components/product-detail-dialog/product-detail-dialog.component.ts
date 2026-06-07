import { Component, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, switchMap } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';
import { ProductResponseDTO, ProductRequestDTO, SupplierOption } from '../../models/product.model';
import { CategoryDTO } from '../../models/category.model';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ProductDetailComponent } from '../product-detail/product-detail.component';

export interface ProductDetailDialogData {
  item:                ProductResponseDTO | null;
  categories:          CategoryDTO[];
  suppliers:           SupplierOption[];
  canWrite:            boolean;
  canDeactivate:       boolean;
}

@Component({
  selector: 'app-product-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, ProductDetailComponent],
  template: `
    <app-product-detail
      [item]="currentItem"
      [categories]="data.categories"
      [suppliers]="data.suppliers"
      [saving]="saving"
      [canWrite]="data.canWrite"
      [canDeactivate]="data.canDeactivate"
      (save)="onSave($event)"
      (cancel)="dialogRef.close(false)"
      (deactivate)="onDeactivate()" />
  `,
  styles: [`:host { display: block; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailDialogComponent {
  readonly data      = inject<ProductDetailDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ProductDetailDialogComponent>);
  private productService = inject(ProductService);
  private dialog     = inject(MatDialog);
  private snackBar   = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private cdr        = inject(ChangeDetectorRef);

  saving      = false;
  currentItem: ProductResponseDTO | null;

  constructor() {
    this.currentItem = this.data.item;
  }

  onSave(request: ProductRequestDTO): void {
    this.saving = true;
    this.cdr.markForCheck();

    const op$ = this.currentItem
      ? this.productService.update(this.currentItem.id, request)
      : this.productService.create(request);

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        const msg = this.currentItem ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.';
        this.snackBar.open(msg, 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        this.cdr.detectChanges();
        const msg = err.error?.message || 'Error al guardar el producto.';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: ['snackbar-error'] });
      }
    });
  }

  onDeactivate(): void {
    if (!this.currentItem) return;
    const item = this.currentItem;
    const confirmData: ConfirmDialogData = {
      title:        'Desactivar producto',
      message:      `¿Deseas desactivar "${item.name}" (${item.sku})?`,
      confirmLabel: 'Desactivar',
      dangerous:    true,
    };
    this.dialog.open(ConfirmDialogComponent, { data: confirmData, width: '420px' })
      .afterClosed()
      .pipe(
        filter(r => r === true),
        switchMap(() => this.productService.delete(item.id)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Producto desactivado.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
          this.dialogRef.close(true);
        },
        error: (err) => {
          const msg = err.error?.message || 'Error al desactivar el producto.';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: ['snackbar-error'] });
        }
      });
  }
}
