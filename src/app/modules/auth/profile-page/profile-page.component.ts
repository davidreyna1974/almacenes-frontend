import {
  Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserService } from '../services/user.service';
import { UserResponse } from '../models/user-response.model';
import { ChangePasswordDialogComponent } from '../change-password-dialog/change-password-dialog.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatDividerModule,
  ],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit {
  private userService = inject(UserService);
  private dialog      = inject(MatDialog);
  private snackBar    = inject(MatSnackBar);
  private cdr         = inject(ChangeDetectorRef);
  private destroyRef  = inject(DestroyRef);

  profile: UserResponse | null = null;
  loading = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.userService.getMyProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: profile => {
          this.profile = profile;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.snackBar.open(err.error?.message ?? 'Error al cargar el perfil.', 'Cerrar',
            { duration: 4000, panelClass: 'snackbar-error' });
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  openChangePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '440px',
      maxWidth: '95vw',
      disableClose: true,
    });
  }

  roleColor(role: string): string {
    const map: Record<string, string> = {
      ROLE_ADMIN:        '#6B3C6B',
      ROLE_MANAGER:      '#1565C0',
      ROLE_WAREHOUSEMAN: '#2E7D32',
      ROLE_SALES:        '#E65100',
    };
    return map[role] ?? '#757575';
  }

  roleLabel(role: string): string {
    const map: Record<string, string> = {
      ROLE_ADMIN:        'Administrador',
      ROLE_MANAGER:      'Manager',
      ROLE_WAREHOUSEMAN: 'Almacenista',
      ROLE_SALES:        'Ventas',
    };
    return map[role] ?? role;
  }
}
