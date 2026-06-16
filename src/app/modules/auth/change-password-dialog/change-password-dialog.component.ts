import {
  Component, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserService } from '../services/user.service';

function passwordsMatchValidator(group: AbstractControl) {
  const newPwd     = group.get('newPassword')?.value;
  const confirmPwd = group.get('confirmPassword')?.value;
  return newPwd && confirmPwd && newPwd !== confirmPwd ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);

  private fb          = inject(FormBuilder);
  private userService = inject(UserService);
  private snackBar    = inject(MatSnackBar);
  private cdr         = inject(ChangeDetectorRef);
  private destroyRef  = inject(DestroyRef);

  loading       = false;
  hideCurrent   = true;
  hideNew       = true;
  hideConfirm   = true;

  form: FormGroup = this.fb.group({
    currentPassword:  ['', [Validators.required]],
    newPassword:      ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword:  ['', [Validators.required]],
  }, { validators: passwordsMatchValidator });

  get mismatch(): boolean {
    return this.form.hasError('passwordsMismatch')
      && (this.form.get('confirmPassword')?.dirty ?? false);
  }

  get saveDisabled(): boolean {
    return this.loading || this.form.invalid;
  }

  onSave(): void {
    if (this.saveDisabled) return;
    this.loading = true;
    this.cdr.markForCheck();

    const { currentPassword, newPassword, confirmPassword } = this.form.value;
    this.userService.changePassword({ currentPassword, newPassword, confirmPassword })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Contraseña cambiada correctamente.', 'Cerrar',
            { duration: 3000, panelClass: 'snackbar-success' });
          this.dialogRef.close();
        },
        error: err => {
          const msg = err?.error?.message ?? 'Error al cambiar la contraseña.';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: 'snackbar-error' });
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }
}
