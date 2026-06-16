import {
  Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserService } from '../services/user.service';
import { LayoutService } from '../../../core/layout/layout.service';
import { UserResponse } from '../models/user-response.model';
import { UserFormDialogComponent, UserFormDialogData } from '../user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule,
    MatTooltipModule, MatProgressBarModule, MatInputModule, MatFormFieldModule,
    MatChipsModule,
  ],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPageComponent implements OnInit {
  private userService  = inject(UserService);
  private layoutService = inject(LayoutService);
  private dialog        = inject(MatDialog);
  private snackBar      = inject(MatSnackBar);
  private cdr           = inject(ChangeDetectorRef);
  private destroyRef    = inject(DestroyRef);

  allUsers: UserResponse[] = [];
  filtered: UserResponse[] = [];
  loading = false;

  pageIndex = 0;
  pageSize  = 20;
  totalElements = 0;

  searchCtrl = new FormControl('');
  readonly displayedColumns = ['username', 'email', 'roles', 'createdAt'];

  ngOnInit(): void {
    setTimeout(() => this.layoutService.collapse(), 0);
    this.load();

    this.searchCtrl.valueChanges.pipe(
      debounceTime(250),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(q => {
      this.pageIndex = 0;
      this.applyFilter(q ?? '');
    });
  }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.userService.getAll(this.pageIndex, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          this.allUsers = page.content;
          this.totalElements = page.totalElements;
          this.applyFilter(this.searchCtrl.value ?? '');
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.snackBar.open(err.error?.message ?? 'Error al cargar los usuarios.', 'Cerrar',
            { duration: 4000, panelClass: 'snackbar-error' });
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize  = event.pageSize;
    this.load();
  }

  private normalize(s: string): string {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  private applyFilter(q: string): void {
    const term = this.normalize(q.trim());
    this.filtered = term
      ? this.allUsers.filter(u =>
          this.normalize(u.username).includes(term) ||
          this.normalize(u.email).includes(term))
      : [...this.allUsers];
    this.cdr.markForCheck();
  }

  onRowClick(user: UserResponse): void {
    this.openDialog(user);
  }

  openNew(): void {
    this.openDialog(null);
  }

  private openDialog(user: UserResponse | null): void {
    const ref = this.dialog.open(UserFormDialogComponent, {
      data: { user } satisfies UserFormDialogData,
      width: '560px',
      maxWidth: '95vw',
      disableClose: true,
    });
    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(saved => { if (saved) this.load(); });
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
      ROLE_ADMIN:        'Admin',
      ROLE_MANAGER:      'Manager',
      ROLE_WAREHOUSEMAN: 'Almacenista',
      ROLE_SALES:        'Ventas',
    };
    return map[role] ?? role;
  }
}
