import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProductService } from '../../services/product.service';
import { ProductResponseDTO, ProductRequestDTO, SupplierOption } from '../../models/product.model';
import { CategoryDTO } from '../../models/category.model';
import { StockMovementResponseDTO } from '../../models/stock-movement.model';
import { PageResponse } from '../../../../shared/models/page-response.model';
import { ProductFormComponent } from '../product-form/product-form.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatProgressBarModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
    ProductFormComponent,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnChanges {
  @Input({ required: true }) item!: ProductResponseDTO | null;
  @Input() categories: CategoryDTO[]  = [];
  @Input() suppliers:  SupplierOption[] = [];
  @Input() saving      = false;
  @Input() canWrite    = false;
  @Input() canDeactivate = false;
  @Output() save       = new EventEmitter<ProductRequestDTO>();
  @Output() cancel     = new EventEmitter<void>();
  @Output() deactivate = new EventEmitter<void>();

  private productService = inject(ProductService);
  private destroyRef     = inject(DestroyRef);
  private cdr            = inject(ChangeDetectorRef);
  private snackBar       = inject(MatSnackBar);

  movements: StockMovementResponseDTO[] = [];
  movPage: PageResponse<StockMovementResponseDTO> | null = null;
  movCurrentPage  = 0;
  movPageSize     = 10;
  movLoading      = false;
  movColumns      = ['date', 'type', 'quantity', 'reason', 'user'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item'] && this.item) {
      this.movCurrentPage = 0;
      this.loadMovements();
    }
    if (changes['item'] && !this.item) {
      this.movements = [];
      this.movPage   = null;
    }
  }

  loadMovements(): void {
    if (!this.item) return;
    this.movLoading = true;
    this.cdr.detectChanges();

    this.productService.getMovements(this.item.id, this.movCurrentPage, this.movPageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.movPage    = page;
          this.movements  = page.content;
          this.movLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.movLoading = false;
          this.cdr.detectChanges();
          this.snackBar.open('Error al cargar el Kardex.', 'Cerrar', { duration: 3000 });
        }
      });
  }

  onMovPageChange(event: PageEvent): void {
    this.movCurrentPage = event.pageIndex;
    this.movPageSize    = event.pageSize;
    this.loadMovements();
  }

  getMovementTypeLabel(type: string): string {
    return type === 'IN' ? 'Entrada' : 'Salida';
  }

  reloadMovements(): void {
    this.movCurrentPage = 0;
    this.loadMovements();
  }
}
