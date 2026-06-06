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
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

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

// Página vacía reutilizable para resultados no encontrados (sin lanzar error)
const EMPTY_PAGE = <PageResponse<ProductResponseDTO>>{
  content: [], currentPage: 0, totalPages: 0,
  totalElements: 0, size: 0, first: true, last: true,
};

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

  displayedColumns = ['sku', 'name', 'categoryName', 'stock', 'price', 'status', 'actions'];

  products: ProductResponseDTO[] = [];
  page: PageResponse<ProductResponseDTO> | null = null;
  currentPage = 0;
  pageSize    = 20;

  categories: CategoryDTO[]   = [];
  suppliers:  SupplierOption[] = [];

  loading = false;

  searchControl  = new FormControl('');
  categoryFilter = new FormControl<number | null>(null);

  // ─── Getters ────────────────────────────────────────────────────────────────

  get selectedCategory(): CategoryDTO | null {
    return this.categories.find(c => c.id === this.categoryFilter.value) ?? null;
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
    this.layoutService.collapse();

    // Pre-aplicar filtro de categoría si viene desde la página de Categorías
    const catId = this.route.snapshot.queryParamMap.get('categoryId');
    if (catId) this.categoryFilter.setValue(+catId);

    forkJoin({
      cats: this.categoryService.getActive(0, 200),
      sups: this.productService.getActiveSuppliers(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ cats, sups }) => {
        this.categories = cats.content;
        this.suppliers  = sups.content;
        this.cdr.detectChanges();
      }
    });

    // Solo reacciona cuando el campo SKU queda vacío (usuario lo borró manualmente)
    // La búsqueda activa se dispara únicamente con Enter (ver searchBySku)
    this.searchControl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      if (!value?.trim()) {
        this.currentPage = 0;
        this.load();
      }
    });

    // Cambio de categoría: desactiva SKU, carga por categoría
    this.categoryFilter.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      if (this.searchControl.value?.trim()) {
        this.searchControl.setValue('', { emitEvent: false });
      }
      this.currentPage = 0;
      this.load();
    });

    this.load();
  }

  // ─── Búsqueda por SKU (solo se dispara con Enter) ───────────────────────────

  searchBySku(): void {
    this.categoryFilter.setValue(null, { emitEvent: false });
    this.currentPage = 0;
    this.load();
  }

  // ─── Carga de datos ─────────────────────────────────────────────────────────

  load(): void {
    const sku   = this.searchControl.value?.trim() ?? '';
    const catId = this.categoryFilter.value;

    if (!sku && !catId) {
      this.products = [];
      this.page     = null;
      this.loading  = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    let obs$;
    if (sku) {
      obs$ = this.productService.getBySku(sku).pipe(
        switchMap(p => of(<PageResponse<ProductResponseDTO>>{
          content: [p], currentPage: 0, totalPages: 1, totalElements: 1,
          size: 1, first: true, last: true,
        })),
        // 404 / 400: SKU no existe → resultado vacío, sin mostrar snackbar de error
        catchError(err => {
          if (err.status === 404 || err.status === 400) return of(EMPTY_PAGE);
          throw err;
        })
      );
    } else {
      obs$ = this.productService.getByCategory(catId!, this.currentPage, this.pageSize);
    }

    obs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => {
        this.page     = page;
        this.products = page.content;
        this.loading  = false;

        // Al encontrar un producto por SKU, sincronizar la categoría (sin emitir)
        if (sku && page.content.length > 0) {
          const foundCatId = page.content[0].categoryId;
          if (foundCatId !== this.categoryFilter.value) {
            this.categoryFilter.setValue(foundCatId, { emitEvent: false });
          }
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.snackBar.open('Error al cargar productos.', 'Cerrar', { duration: 4000, panelClass: ['snackbar-error'] });
      }
    });
  }

  // ─── Eventos de UI ──────────────────────────────────────────────────────────

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize    = event.pageSize;
    this.load();
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
      .subscribe(() => this.load());
  }

  openDetail(item: ProductResponseDTO): void {
    const data: ProductDetailDialogData = {
      item,
      categories:    this.categories,
      suppliers:     this.suppliers,
      canWrite:      this.canWrite(),
      canDeactivate: this.canDeactivate(),
    };
    this.dialog.open(ProductDetailDialogComponent, { ...DIALOG_CONFIG, data })
      .afterClosed()
      .pipe(filter(r => r === true), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }

  openMovementDialog(item: ProductResponseDTO): void {
    this.dialog.open(MovementDialogComponent, {
      data:  { product: item },
      width: '480px',
    }).afterClosed().pipe(
      filter(r => r === true),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.load());
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      AVAILABLE:    'Disponible',
      DISCONTINUED: 'Descontinuado',
      OUT_OF_STOCK: 'Sin stock',
    };
    return map[status] ?? status;
  }
}
