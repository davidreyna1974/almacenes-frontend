import { Component, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, switchMap } from 'rxjs/operators';
import { ClientService } from '../../services/client.service';
import { ClientDTO, ClientRequest } from '../../models/client.model';
import { ClientFormComponent } from '../client-form/client-form.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

export interface ClientDialogData {
  item:          ClientDTO | null;
  canWrite:      boolean;
  canDeactivate: boolean;
}

@Component({
  selector: 'app-client-form-dialog',
  standalone: true,
  imports: [MatDialogModule, ClientFormComponent],
  template: `
    <app-client-form
      [item]="data.item"
      [canWrite]="data.canWrite"
      [canDeactivate]="data.canDeactivate"
      [saving]="saving"
      (save)="onSave($event)"
      (cancel)="dialogRef.close(false)"
      (deactivate)="onDeactivate()" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFormDialogComponent {
  readonly data      = inject<ClientDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ClientFormDialogComponent>);
  private clientService = inject(ClientService);
  private dialog     = inject(MatDialog);
  private snackBar   = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private cdr        = inject(ChangeDetectorRef);

  saving = false;

  onSave(request: ClientRequest): void {
    this.saving = true;
    this.cdr.markForCheck();

    const op$ = this.data.item
      ? this.clientService.update(this.data.item.id!, request)
      : this.clientService.create(request);

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        const msg = this.data.item ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.';
        this.snackBar.open(msg, 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        this.cdr.detectChanges();
        const msg = err.error?.message || 'Error al guardar el cliente.';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: ['snackbar-error'] });
      }
    });
  }

  onDeactivate(): void {
    if (!this.data.item) return;
    const item = this.data.item;
    const confirmData: ConfirmDialogData = {
      title:        'Desactivar cliente',
      message:      `¿Deseas desactivar al cliente "${item.name}"? No podrá usarse en nuevas órdenes de venta.`,
      confirmLabel: 'Desactivar',
      dangerous:    true,
    };
    this.dialog.open(ConfirmDialogComponent, { data: confirmData, width: '420px', disableClose: true })
      .afterClosed()
      .pipe(
        filter(r => r === true),
        switchMap(() => this.clientService.deactivate(item.id!)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Cliente desactivado.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
          this.dialogRef.close(true);
        },
        error: (err) => {
          const msg = err.error?.message || 'No se pudo desactivar el cliente.';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: ['snackbar-error'] });
        }
      });
  }
}
