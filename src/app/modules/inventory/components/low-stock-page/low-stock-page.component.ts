import {
  Component, OnInit, inject, DestroyRef,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProductService } from '../../services/product.service';
import { ProductResponseDTO } from '../../models/product.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { LayoutService } from '../../../../core/layout/layout.service';
import { MovementDialogComponent } from '../movement-dialog/movement-dialog.component';

export interface LowStockItem extends ProductResponseDTO {
  deficit: number;
}

@Component({
  selector: 'app-low-stock-page',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './low-stock-page.component.html',
  styleUrl: './low-stock-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LowStockPageComponent implements OnInit {
  private productService = inject(ProductService);
  private authService    = inject(AuthService);
  private layoutService  = inject(LayoutService);
  private dialog         = inject(MatDialog);
  private snackBar       = inject(MatSnackBar);
  private cdr            = inject(ChangeDetectorRef);
  private destroyRef     = inject(DestroyRef);

  items: LowStockItem[] = [];
  loading = false;
  displayedColumns: string[] = [];

  canWrite():            boolean {
    return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER');
  }
  canRegisterMovement(): boolean {
    return this.authService.hasRole('ROLE_ADMIN')
        || this.authService.hasRole('ROLE_MANAGER')
        || this.authService.hasRole('ROLE_WAREHOUSEMAN');
  }

  get sinStockCount(): number {
    return this.items.filter(i => i.availableStock === 0).length;
  }
  get criticoCount(): number {
    return this.items.filter(i => i.availableStock > 0 && i.currentStock < i.minimumStock).length;
  }
  get reservasCount(): number {
    return this.items.filter(i => i.currentStock >= i.minimumStock).length;
  }

  ngOnInit(): void {
    const cols = [
      'severity', 'sku', 'name', 'categoryName', 'supplierName',
      'currentStock', 'reservedStock', 'availableStock', 'minimumStock', 'deficit',
    ];
    if (this.canWrite()) cols.push('unitCost');
    if (this.canRegisterMovement()) cols.push('actions');
    this.displayedColumns = cols;

    setTimeout(() => this.layoutService.collapse(), 0);
    this.load();
  }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.productService.getLowStock(0, 200)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          this.items = page.content
            .map(p => ({ ...p, deficit: p.minimumStock - p.availableStock }))
            .sort((a, b) => b.deficit - a.deficit);
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
          this.snackBar.open('Error al cargar productos con bajo stock.', 'Cerrar', {
            duration: 4000, panelClass: ['snackbar-error'],
          });
        },
      });
  }

  getSeverity(item: LowStockItem): 'sin-stock' | 'critico' | 'reservas' {
    if (item.availableStock === 0) return 'sin-stock';
    if (item.currentStock < item.minimumStock) return 'critico';
    return 'reservas';
  }

  getSeverityLabel(item: LowStockItem): string {
    const s = this.getSeverity(item);
    if (s === 'sin-stock') return 'Sin stock';
    if (s === 'critico')   return 'Crítico';
    return 'Por reservas';
  }

  openMovementDialog(item: LowStockItem): void {
    this.dialog.open(MovementDialogComponent, {
      data:  { product: item },
      width: '480px',
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result === true) this.load();
      });
  }
}
