import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter } from 'rxjs/operators';

import { CategoryService } from '../../services/category.service';
import { CategoryDTO } from '../../models/category.model';
import { PageResponse } from '../../../../shared/models/page-response.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { LayoutService } from '../../../../core/layout/layout.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { CategoryFormDialogComponent, CategoryDialogData } from '../category-form-dialog/category-form-dialog.component';

const DIALOG_CONFIG = {
  width:         '640px',
  maxWidth:      '92vw',
  maxHeight:     '80vh',
  position:      { top: '64px' },
  backdropClass: 'catalog-backdrop',
  panelClass:    'catalog-form-dialog',
};

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    EmptyStateComponent,
  ],
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPageComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private authService     = inject(AuthService);
  private layoutService   = inject(LayoutService);
  private dialog          = inject(MatDialog);
  private snackBar        = inject(MatSnackBar);
  private router          = inject(Router);
  private destroyRef      = inject(DestroyRef);
  private cdr             = inject(ChangeDetectorRef);

  displayedColumns = ['name', 'description', 'actions'];

  categories: CategoryDTO[] = [];
  page: PageResponse<CategoryDTO> | null = null;
  currentPage = 0;
  pageSize    = 20;
  loading     = false;

  canWrite():      boolean { return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER'); }
  canDeactivate(): boolean { return this.authService.hasRole('ROLE_ADMIN'); }

  ngOnInit(): void {
    setTimeout(() => this.layoutService.collapse(), 0);
    this.load();
  }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.categoryService.getActive(this.currentPage, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.page       = page;
          this.categories = page.content;
          this.loading    = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
          this.snackBar.open('Error al cargar categorías.', 'Cerrar', { duration: 4000, panelClass: ['snackbar-error'] });
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize    = event.pageSize;
    this.load();
  }

  openNew(): void {
    const data: CategoryDialogData = { item: null, canDeactivate: false };
    this.dialog.open(CategoryFormDialogComponent, { ...DIALOG_CONFIG, data })
      .afterClosed()
      .pipe(filter(r => r === true), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }

  openEdit(item: CategoryDTO): void {
    const data: CategoryDialogData = { item, canDeactivate: this.canDeactivate() };
    this.dialog.open(CategoryFormDialogComponent, { ...DIALOG_CONFIG, data })
      .afterClosed()
      .pipe(filter(r => r === true), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }

  onRowClick(item: CategoryDTO): void {
    if (this.canWrite()) this.openEdit(item);
  }

  viewProducts(categoryId?: number): void {
    if (categoryId) {
      this.router.navigate(['/inventory/products'], { queryParams: { categoryId } });
    } else {
      this.router.navigate(['/inventory/products']);
    }
  }
}
