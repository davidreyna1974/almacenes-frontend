import {
  Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SupplierService } from '../../services/supplier.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { LayoutService } from '../../../../core/layout/layout.service';
import { SupplierDTO } from '../../models/supplier.model';
import { SupplierDialogComponent, SupplierDialogData } from '../supplier-dialog/supplier-dialog.component';

@Component({
  selector: 'app-suppliers-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressBarModule, MatInputModule, MatFormFieldModule,
  ],
  templateUrl: './suppliers-page.component.html',
  styleUrl: './suppliers-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliersPageComponent implements OnInit {
  private supplierService = inject(SupplierService);
  private authService     = inject(AuthService);
  private layoutService   = inject(LayoutService);
  private dialog          = inject(MatDialog);
  private snackBar        = inject(MatSnackBar);
  private cdr             = inject(ChangeDetectorRef);
  private destroyRef      = inject(DestroyRef);

  suppliers: SupplierDTO[] = [];
  filtered:  SupplierDTO[] = [];
  loading = false;

  searchCtrl = new FormControl('');
  readonly displayedColumns = ['rfc', 'companyName', 'contactName', 'phone'];

  canWrite(): boolean {
    return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER');
  }

  ngOnInit(): void {
    setTimeout(() => this.layoutService.collapse(), 0);
    this.load();

    this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(q => this.applyFilter(q ?? ''));
  }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.supplierService.getActive(0, 200)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          this.suppliers = page.content;
          this.applyFilter(this.searchCtrl.value ?? '');
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.snackBar.open(err.error?.message ?? 'Error al cargar proveedores', 'Cerrar',
            { duration: 4000, panelClass: 'snack-error' });
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private normalize(s: string): string {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  private applyFilter(q: string): void {
    const term = this.normalize(q.trim());
    this.filtered = term
      ? this.suppliers.filter(s =>
          this.normalize(s.companyName).includes(term) ||
          this.normalize(s.rfc).includes(term))
      : [...this.suppliers];
    this.cdr.markForCheck();
  }

  onRowClick(supplier: SupplierDTO): void {
    this.openDialog(supplier, true);
  }

  openNew(): void {
    this.openDialog(null, false);
  }

  private openDialog(supplier: SupplierDTO | null, isEdit: boolean): void {
    const ref = this.dialog.open(SupplierDialogComponent, {
      data: { supplier, isEdit } satisfies SupplierDialogData,
      width: '640px',
      maxWidth: '95vw',
    });
    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(saved => { if (saved) this.load(); });
  }
}
