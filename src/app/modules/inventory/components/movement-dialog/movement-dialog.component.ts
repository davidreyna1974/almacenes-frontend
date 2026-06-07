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
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule,
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
  errorMessage: string | null = null;

  form: FormGroup = this.fb.group({
    type:     ['IN',  Validators.required],
    quantity: [null, [Validators.required, Validators.min(1)]],
    reason:   ['',   [Validators.required, Validators.maxLength(300)]],
  });

  get availableStock(): number {
    return this.data.product.currentStock - (this.data.product.reservedStock ?? 0);
  }

  constructor(
    public dialogRef: MatDialogRef<MovementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MovementDialogData,
  ) {
    this.form.get('type')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(type => this.updateQuantityValidators(type));
  }

  private updateQuantityValidators(type: string): void {
    const qty = this.form.get('quantity')!;
    const validators = type === 'OUT'
      ? [Validators.required, Validators.min(1), Validators.max(this.availableStock)]
      : [Validators.required, Validators.min(1)];
    qty.setValidators(validators);
    qty.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.errorMessage = null;
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
          this.errorMessage = err.error?.message || 'Error al registrar el movimiento.';
          this.cdr.markForCheck();
        },
      });
  }
}
