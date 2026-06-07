import { Component, Inject, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ProductService } from '../../services/product.service';
import { ProductResponseDTO } from '../../models/product.model';
import { StockMovementRequestDTO } from '../../models/stock-movement.model';

export interface MovementDialogData {
  product: ProductResponseDTO;
}

@Component({
  selector: 'app-movement-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './movement-dialog.component.html',
  styleUrl: './movement-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementDialogComponent {
  private fb             = inject(FormBuilder);
  private productService = inject(ProductService);
  private snackBar       = inject(MatSnackBar);
  private cdr            = inject(ChangeDetectorRef);
  private destroyRef     = inject(DestroyRef);

  saving = false;

  form: FormGroup = this.fb.group({
    type:     ['IN',  Validators.required],
    quantity: [null, [Validators.required, Validators.min(1)]],
    reason:   ['',   [Validators.required, Validators.maxLength(300)]],
  });

  constructor(
    public dialogRef: MatDialogRef<MovementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MovementDialogData,
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.cdr.markForCheck();

    const request: StockMovementRequestDTO = {
      productId: this.data.product.id,
      ...this.form.value,
    };

    this.productService.registerMovement(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving = false;
          this.snackBar.open('Movimiento registrado correctamente.', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success'],
          });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving = false;
          this.cdr.markForCheck();
          const msg = err.error?.message || 'Error al registrar el movimiento.';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: ['snackbar-error'] });
        },
      });
  }
}
