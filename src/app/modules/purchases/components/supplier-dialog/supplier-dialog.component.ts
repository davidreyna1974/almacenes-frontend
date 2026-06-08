import {
  Component, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SupplierService } from '../../services/supplier.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SupplierFormComponent } from '../supplier-form/supplier-form.component';
import { SupplierDTO } from '../../models/supplier.model';

export interface SupplierDialogData {
  supplier: SupplierDTO | null;
  isEdit: boolean;
}

@Component({
  selector: 'app-supplier-dialog',
  standalone: true,
  imports: [MatDialogModule, SupplierFormComponent],
  template: `
    <h2 mat-dialog-title>
      {{ data.isEdit ? (canWrite() ? 'Editar proveedor' : 'Ver proveedor') : 'Nuevo proveedor' }}
    </h2>
    <mat-dialog-content>
      <app-supplier-form
        [supplier]="data.supplier"
        [isEdit]="data.isEdit"
        [canWrite]="canWrite()"
        [canDeactivate]="canDeactivate() && data.isEdit"
        [loading]="loading"
        (save)="onSave($event)"
        (cancel)="dialogRef.close(false)"
        (deactivate)="onDeactivate()">
      </app-supplier-form>
    </mat-dialog-content>
  `,
  styles: [`:host { display: block; } mat-dialog-content { padding-top: 4px !important; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierDialogComponent {
  readonly data      = inject<SupplierDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<SupplierDialogComponent>);

  private supplierService = inject(SupplierService);
  private authService     = inject(AuthService);
  private dialog          = inject(MatDialog);
  private snackBar        = inject(MatSnackBar);
  private cdr             = inject(ChangeDetectorRef);
  private destroyRef      = inject(DestroyRef);

  loading = false;

  canWrite():      boolean { return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER'); }
  canDeactivate(): boolean { return this.authService.hasRole('ROLE_ADMIN'); }

  onSave(dto: SupplierDTO): void {
    this.loading = true;
    this.cdr.markForCheck();
    const op$ = this.data.isEdit
      ? this.supplierService.update(this.data.supplier!.id!, dto)
      : this.supplierService.create(dto);

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackBar.open(
          this.data.isEdit ? 'Proveedor actualizado correctamente.' : 'Proveedor creado correctamente.',
          'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
        this.dialogRef.close(true);
      },
      error: err => {
        this.snackBar.open(err.error?.message ?? 'Error al guardar proveedor', 'Cerrar',
          { duration: 4000, panelClass: 'snackbar-error' });
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onDeactivate(): void {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Desactivar proveedor',
        message: `¿Desactivar a "${this.data.supplier?.companyName}"? No podrá usarse en nuevas órdenes.`,
        confirmLabel: 'Desactivar',
        confirmColor: 'warn',
      },
    });

    confirmRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.loading = true;
        this.cdr.markForCheck();
        this.supplierService.deactivate(this.data.supplier!.id!)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Proveedor desactivado.', 'Cerrar',
                { duration: 3000, panelClass: 'snackbar-success' });
              this.dialogRef.close(true);
            },
            error: err => {
              this.snackBar.open(err.error?.message ?? 'No se pudo desactivar el proveedor', 'Cerrar',
                { duration: 5000, panelClass: 'snackbar-error' });
              this.loading = false;
              this.cdr.markForCheck();
            },
          });
      });
  }
}
