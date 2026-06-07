import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, EMPTY, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError } from 'rxjs/operators';

import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ProductResponseDTO, SupplierOption } from '../../models/product.model';
import { CategoryDTO } from '../../models/category.model';
import { PageResponse } from '../../../../shared/models/page-response.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { LayoutService } from '../../../../core/layout/layout.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StockBadgeComponent } from '../stock-badge/stock-badge.component';
import { MovementDialogComponent } from '../movement-dialog/movement-dialog.component';
import { ProductDetailDialogComponent, ProductDetailDialogData } from '../product-detail-dialog/product-detail-dialog.component';

const DIALOG_CONFIG = {
  width:         '700px',
  maxWidth:      '92vw',
  maxHeight:     '80vh',
  position:      { top: '64px' },
  backdropClass: 'catalog-backdrop',
  panelClass:    'catalog-form-dialog',
};

const PRODUCT_STATUSES = [
  { value: 'AVAILABLE',    label: 'Disponible'     },
  { value: 'DISCONTINUED', label: 'Descontinuado'  },
  { value: 'OUT_OF_STOCK', label: 'Sin stock'       },
];

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    EmptyStateComponent,
    StockBadgeComponent,
  ],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageComponent implements OnInit {
  private productService  = inject(ProductService);
  private categoryService = inject(CategoryService);
  private authService     = inject(AuthService);
  private layoutService   = inject(LayoutService);
  private dialog          = inject(MatDialog);
  private snackBar        = inject(MatSnackBar);
  private route           = inject(ActivatedRoute);
  private destroyRef      = inject(DestroyRef);
  private cdr             = inject(ChangeDetectorRef);

  // switchMap cancela la petición HTTP anterior ante una nueva (race condition fix).
  private searchTrigger$ = new Subject<void>();

  displayedColumns: string[] = [];

  products: ProductResponseDTO[] = [];
  page: PageResponse<ProductResponseDTO> | null = null;
  currentPage = 0;
  pageSize    = 20;

  categories:  CategoryDTO[]    = [];
  suppliers:   SupplierOption[] = [];
  statuses     = PRODUCT_STATUSES;

  loading            = false;
  selectedProductId: number | null = null;

  searchControl    = new FormControl('');
  categoryFilter   = new FormControl<number | null>(null);
  statusFilter     = new FormControl<string | null>(null);
  supplierFilter   = new FormControl<number | null>(null);

  // ─── Getters ────────────────────────────────────────────────────────────────

  get activeFilterCount(): number {
    return [
      this.searchControl.value?.trim(),
      this.categoryFilter.value,
      this.statusFilter.value,
      this.supplierFilter.value,
    ].filter(v => v != null && v !== '').length;
  }

  canWrite():            boolean { return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER'); }
  canDeactivate():       boolean { return this.authService.hasRole('ROLE_ADMIN'); }
  canRegisterMovement(): boolean {
    return this.authService.hasRole('ROLE_ADMIN')
        || this.authService.hasRole('ROLE_MANAGER')
        || this.authService.hasRole('ROLE_WAREHOUSEMAN');
  }

  // ─── Inicialización ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    const cols = ['sku', 'name', 'categoryName', 'supplierName', 'stock', 'price'];
    if (this.canWrite()) cols.push('unitCost');
    cols.push('status');
    if (this.canRegisterMovement()) cols.push('actions');
    this.displayedColumns = cols;

    // setTimeout(0) aplaza collapse al siguiente ciclo para evitar NG0100
    // (ExpressionChangedAfterItHasBeenCheckedError) cuando MainLayout ya leyó collapsed$.
    setTimeout(() => this.layoutService.collapse(), 0);

    // { emitEvent: false } evita que valueChanges dispare la búsqueda antes
    // de que searchTrigger$ esté suscrito, previniendo la doble petición (BUG-02).
    const catId = this.route.snapshot.queryParamMap.get('categoryId');
    if (catId) this.categoryFilter.setValue(+catId, { emitEvent: false });

    forkJoin({
      cats: this.categoryService.getActive(0, 200),
      sups: this.productService.getActiveSuppliers().pipe(
        catchError(() => of({ content: [] as SupplierOption[] } as PageResponse<SupplierOption>))
      ),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ cats, sups }) => {
        this.categories = cats.content;
        this.suppliers  = sups.content;
        this.cdr.detectChanges();
      }
    });

    // switchMap cancela la petición anterior si llega una nueva (BUG-01 fix)
    this.searchTrigger$.pipe(
      switchMap(() => {
        this.loading = true;
        this.cdr.detectChanges();
        return this.productService.search({
          search:     this.searchControl.value?.trim() || undefined,
          categoryId: this.categoryFilter.value ?? undefined,
          status:     this.statusFilter.value ?? undefined,
          supplierId: this.supplierFilter.value ?? undefined,
          page:       this.currentPage,
          size:       this.pageSize,
        }).pipe(
          catchError(() => {
            this.loading = false;
            this.cdr.detectChanges();
            this.snackBar.open('Error al cargar productos.', 'Cerrar', { duration: 4000, panelClass: ['snackbar-error'] });
            return EMPTY;
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(page => {
      this.page     = page;
      this.products = page.content;
      this.loading  = false;
      this.cdr.detectChanges();
    });

    // Búsqueda de texto: debounce 400ms — permite tipeo fluido antes de llamar al backend
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.currentPage = 0;
      this.searchTrigger$.next();
    });

    // Filtros de selección: reaccionan inmediatamente al cambio
    this.categoryFilter.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.currentPage = 0; this.searchTrigger$.next(); });

    this.statusFilter.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.currentPage = 0; this.searchTrigger$.next(); });

    this.supplierFilter.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.currentPage = 0; this.searchTrigger$.next(); });

    // Carga inicial
    this.searchTrigger$.next();
  }

  // ─── Eventos de UI ──────────────────────────────────────────────────────────

  clearFilters(): void {
    this.searchControl.setValue('',    { emitEvent: false });
    this.categoryFilter.setValue(null, { emitEvent: false });
    this.statusFilter.setValue(null,   { emitEvent: false });
    this.supplierFilter.setValue(null,  { emitEvent: false });
    this.currentPage = 0;
    this.searchTrigger$.next();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize    = event.pageSize;
    this.searchTrigger$.next();
  }

  openNew(): void {
    const data: ProductDetailDialogData = {
      item:          null,
      categories:    this.categories,
      suppliers:     this.suppliers,
      canWrite:      true,
      canDeactivate: false,
    };
    this.dialog.open(ProductDetailDialogComponent, { ...DIALOG_CONFIG, data })
      .afterClosed()
      .pipe(filter(r => r === true), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.searchTrigger$.next());
  }

  openDetail(item: ProductResponseDTO): void {
    this.selectedProductId = item.id;
    this.cdr.markForCheck();

    const data: ProductDetailDialogData = {
      item,
      categories:    this.categories,
      suppliers:     this.suppliers,
      canWrite:      this.canWrite(),
      canDeactivate: this.canDeactivate(),
    };
    this.dialog.open(ProductDetailDialogComponent, { ...DIALOG_CONFIG, data })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        this.selectedProductId = null;
        this.cdr.markForCheck();
        if (result === true) this.searchTrigger$.next();
      });
  }

  openMovementDialog(item: ProductResponseDTO): void {
    this.selectedProductId = item.id;
    this.cdr.markForCheck();

    this.dialog.open(MovementDialogComponent, {
      data:  { product: item },
      width: '480px',
    }).afterClosed().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      this.selectedProductId = null;
      this.cdr.markForCheck();
      if (result === true) this.searchTrigger$.next();
    });
  }

  getStatusLabel(status: string): string {
    return PRODUCT_STATUSES.find(s => s.value === status)?.label ?? status;
  }
}
