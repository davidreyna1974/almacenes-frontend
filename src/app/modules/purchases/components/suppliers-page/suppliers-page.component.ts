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
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SupplierDTO } from '../../models/supplier.model';
import { SupplierFormComponent } from '../supplier-form/supplier-form.component';

@Component({
  selector: 'app-suppliers-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressBarModule, MatInputModule, MatFormFieldModule,
    SupplierFormComponent,
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

  selected:  SupplierDTO | null = null;
  isEdit = false;
  showForm = false;

  searchCtrl = new FormControl('');
  displayedColumns: string[] = [];

  canWrite():      boolean { return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER'); }
  canDeactivate(): boolean { return this.authService.hasRole('ROLE_ADMIN'); }

  ngOnInit(): void {
    this.displayedColumns = ['rfc', 'companyName', 'contactName', 'phone', 'actions'];
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

  private applyFilter(q: string): void {
    const term = q.toLowerCase().trim();
    this.filtered = term
      ? this.suppliers.filter(s =>
          s.companyName.toLowerCase().includes(term) ||
          s.rfc.toLowerCase().includes(term))
      : [...this.suppliers];
    this.cdr.markForCheck();
  }

  onRowClick(supplier: SupplierDTO): void {
    this.selected = supplier;
    this.isEdit   = true;
    this.showForm = true;
    this.cdr.markForCheck();
  }

  openNew(): void {
    this.selected = null;
    this.isEdit   = false;
    this.showForm = true;
    this.cdr.markForCheck();
  }

  onCancel(): void {
    this.showForm = false;
    this.selected = null;
    this.cdr.markForCheck();
  }

  onSave(dto: SupplierDTO): void {
    this.loading = true;
    this.cdr.markForCheck();
    const op$ = this.isEdit
      ? this.supplierService.update(this.selected!.id!, dto)
      : this.supplierService.create(dto);

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Proveedor actualizado correctamente.' : 'Proveedor creado correctamente.',
          'Cerrar', { duration: 3000, panelClass: 'snack-success' });
        this.showForm = false;
        this.selected = null;
        this.load();
      },
      error: err => {
        this.snackBar.open(err.error?.message ?? 'Error al guardar proveedor', 'Cerrar',
          { duration: 4000, panelClass: 'snack-error' });
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onDeactivate(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Desactivar proveedor',
        message: `¿Desactivar a "${this.selected?.companyName}"? No podrá usarse en nuevas órdenes.`,
        confirmLabel: 'Desactivar',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.loading = true;
        this.cdr.markForCheck();
        this.supplierService.deactivate(this.selected!.id!)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Proveedor desactivado.', 'Cerrar',
                { duration: 3000, panelClass: 'snack-success' });
              this.showForm = false;
              this.selected = null;
              this.load();
            },
            error: err => {
              this.snackBar.open(err.error?.message ?? 'No se pudo desactivar el proveedor', 'Cerrar',
                { duration: 5000, panelClass: 'snack-error' });
              this.loading = false;
              this.cdr.markForCheck();
            },
          });
      });
  }
}
