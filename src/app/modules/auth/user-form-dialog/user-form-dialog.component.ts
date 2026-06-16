import {
  Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { UserService } from '../services/user.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { UserResponse } from '../models/user-response.model';

export interface UserFormDialogData {
  user: UserResponse | null;
}

const ALL_ROLES = [
  { value: 'ROLE_ADMIN',        label: 'Administrador' },
  { value: 'ROLE_MANAGER',      label: 'Manager' },
  { value: 'ROLE_WAREHOUSEMAN', label: 'Almacenista' },
  { value: 'ROLE_SALES',        label: 'Ventas' },
];

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule,
    MatCheckboxModule, MatProgressSpinnerModule, MatDividerModule,
  ],
  templateUrl: './user-form-dialog.component.html',
  styleUrl: './user-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormDialogComponent implements OnInit {
  readonly data      = inject<UserFormDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);

  private fb          = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private dialog      = inject(MatDialog);
  private snackBar    = inject(MatSnackBar);
  private cdr         = inject(ChangeDetectorRef);
  private destroyRef  = inject(DestroyRef);

  readonly allRoles = ALL_ROLES;
  readonly isEdit   = !!this.data.user;

  form!: FormGroup;
  loading = false;
  hidePassword = true;

  get canDeactivate(): boolean {
    if (!this.isEdit || !this.data.user) return false;
    return this.data.user.username !== this.authService.getUsername();
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      username: [this.data.user?.username ?? '', [Validators.required, Validators.maxLength(50)]],
      email:    [this.data.user?.email    ?? '', [Validators.required, Validators.email, Validators.maxLength(100)]],
      password: ['', this.isEdit ? [] : [Validators.required, Validators.minLength(8)]],
      roles:    [this.data.user?.roles ?? [], [Validators.required]],
    });

    if (this.isEdit) {
      this.form.get('password')?.disable();
    }
  }

  get rolesValue(): string[] {
    return this.form.get('roles')?.value ?? [];
  }

  isRoleChecked(role: string): boolean {
    return this.rolesValue.includes(role);
  }

  toggleRole(role: string): void {
    const current: string[] = [...this.rolesValue];
    const idx = current.indexOf(role);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(role);
    }
    this.form.get('roles')!.setValue(current);
    this.form.get('roles')!.markAsDirty();
    this.form.markAsDirty();
  }

  get rolesInvalid(): boolean {
    return this.rolesValue.length === 0;
  }

  get saveDisabled(): boolean {
    return this.loading || this.form.invalid || !this.form.dirty || this.rolesInvalid;
  }

  onSave(): void {
    if (this.saveDisabled) return;
    this.loading = true;
    this.cdr.markForCheck();

    const { username, email, password, roles } = this.form.getRawValue();
    const originalRoles = this.data.user?.roles ?? [];
    const rolesChanged  = JSON.stringify([...roles].sort()) !== JSON.stringify([...originalRoles].sort());

    if (!this.isEdit) {
      this.userService.create({ username, email, password, roles })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.snackBar.open('Usuario creado correctamente.', 'Cerrar',
              { duration: 3000, panelClass: 'snackbar-success' });
            this.dialogRef.close(true);
          },
          error: err => this.handleError(err, 'crear'),
        });
    } else {
      const updateData$ = this.userService.update(this.data.user!.id, { username, email });
      const rolesData$  = rolesChanged
        ? this.userService.assignRoles(this.data.user!.id, { roles })
        : of(null);

      forkJoin([updateData$, rolesData$])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.snackBar.open('Usuario actualizado correctamente.', 'Cerrar',
              { duration: 3000, panelClass: 'snackbar-success' });
            this.dialogRef.close(true);
          },
          error: err => this.handleError(err, 'actualizar'),
        });
    }
  }

  onDeactivate(): void {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Desactivar usuario',
        message: `¿Desactivar al usuario "${this.data.user?.username}"? No podrá iniciar sesión.`,
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

        this.userService.deactivate(this.data.user!.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Usuario desactivado.', 'Cerrar',
                { duration: 3000, panelClass: 'snackbar-success' });
              this.dialogRef.close(true);
            },
            error: err => this.handleError(err, 'desactivar'),
          });
      });
  }

  private handleError(err: unknown, action: string): void {
    const msg = (err as { error?: { message?: string } })?.error?.message
      ?? `Error al ${action} el usuario.`;
    this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: 'snackbar-error' });
    this.loading = false;
    this.cdr.markForCheck();
  }
}
