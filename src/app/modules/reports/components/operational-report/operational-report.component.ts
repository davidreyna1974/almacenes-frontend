import {
  Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap, startWith, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReportService } from '../../services/report.service';
import { ProductService } from '../../../inventory/services/product.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ProductResponseDTO } from '../../../inventory/models/product.model';
import {
  LowStockReportItemDTO, KardexReportDTO,
  MovementsSummaryDTO, InventoryTurnoverItemDTO, TurnoverInterpretation,
} from '../../models/report.model';

@Component({
  selector: 'app-operational-report',
  standalone: true,
  imports: [
    CommonModule, DatePipe, ReactiveFormsModule,
    MatTabsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatAutocompleteModule,
    MatProgressBarModule, MatDatepickerModule, MatTooltipModule,
  ],
  templateUrl: './operational-report.component.html',
  styleUrl: './operational-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationalReportComponent implements OnInit {
  private reportService  = inject(ReportService);
  private productService = inject(ProductService);
  private authService    = inject(AuthService);
  private snackBar       = inject(MatSnackBar);
  private cdr            = inject(ChangeDetectorRef);
  private destroyRef     = inject(DestroyRef);

  get canViewTurnover(): boolean {
    return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER');
  }

  // ── Tab 0: Stock bajo ────────────────────────────────────────────────────
  stockLoading = false;
  stockItems: LowStockReportItemDTO[] = [];
  readonly stockCols = ['sku', 'name', 'categoryName', 'availableStock', 'reservedStock', 'currentStock', 'minimumStock', 'deficit'];

  // ── Tab 1: Kardex ────────────────────────────────────────────────────────
  productCtrl = new FormControl<string>('');
  selectedProduct: ProductResponseDTO | null = null;
  filteredProducts: ProductResponseDTO[] = [];
  kardexFromCtrl = new FormControl<Date | null>(null);
  kardexToCtrl   = new FormControl<Date | null>(null);
  kardexLoading  = false;
  kardexData: KardexReportDTO | null = null;
  readonly kardexCols = ['date', 'type', 'quantity', 'reason', 'balance', 'createdByUsername'];

  // ── Tab 2: Movimientos ───────────────────────────────────────────────────
  movFromCtrl = new FormControl<Date | null>(null);
  movToCtrl   = new FormControl<Date | null>(null);
  movLoading  = false;
  movSummary: MovementsSummaryDTO | null = null;

  // ── Tab 3: Rotación ──────────────────────────────────────────────────────
  turnFromCtrl = new FormControl<Date | null>(null);
  turnToCtrl   = new FormControl<Date | null>(null);
  turnLoading    = false;
  turnoverQueried = false;
  turnoverItems: InventoryTurnoverItemDTO[] = [];
  readonly turnoverCols = ['sku', 'name', 'categoryName', 'cogsInPeriod', 'currentInventoryValue', 'turnoverRate', 'interpretation'];

  ngOnInit(): void {
    this.loadStockBajo();
    this.setupProductAutocomplete();
  }

  // ── Stock bajo ───────────────────────────────────────────────────────────

  loadStockBajo(): void {
    this.stockLoading = true;
    this.cdr.markForCheck();
    this.reportService.getLowStock().pipe(
      finalize(() => { this.stockLoading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: items => { this.stockItems = items; this.cdr.markForCheck(); },
      error: () => this.snackBar.open('Error al cargar stock bajo', 'Cerrar',
        { duration: 5000, panelClass: ['snackbar-error'] }),
    });
  }

  stockFillPct(item: LowStockReportItemDTO): number {
    if (item.minimumStock <= 0) return 100;
    return Math.min(100, Math.round((item.availableStock / item.minimumStock) * 100));
  }

  // ── Kardex ───────────────────────────────────────────────────────────────

  private setupProductAutocomplete(): void {
    this.productCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(350),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value !== 'string' || value.length < 2) return of({ content: [] } as any);
        return this.productService.search({ search: value, size: 10 });
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(page => {
      this.filteredProducts = page.content ?? [];
      this.cdr.markForCheck();
    });
  }

  displayProduct(p: ProductResponseDTO | null): string {
    return p ? `${p.sku} — ${p.name}` : '';
  }

  onProductSelected(product: ProductResponseDTO): void {
    this.selectedProduct = product;
    this.kardexData = null;
    this.cdr.markForCheck();
  }

  onProductInputClear(): void {
    this.productCtrl.setValue('');
    this.selectedProduct = null;
    this.kardexData = null;
    this.cdr.markForCheck();
  }

  loadKardex(): void {
    if (!this.selectedProduct) return;
    if (!this.kardexDatesValid()) return;
    this.kardexLoading = true;
    this.cdr.markForCheck();
    this.reportService.getKardex(
      this.selectedProduct.id,
      this.toIsoDate(this.kardexFromCtrl.value),
      this.toIsoDate(this.kardexToCtrl.value),
    ).pipe(
      finalize(() => { this.kardexLoading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: data => { this.kardexData = data; this.cdr.markForCheck(); },
      error: () => this.snackBar.open('Producto no encontrado o error al consultar el Kardex', 'Cerrar',
        { duration: 5000, panelClass: ['snackbar-error'] }),
    });
  }

  kardexDatesValid(): boolean {
    return this.datesValid(this.kardexFromCtrl.value, this.kardexToCtrl.value);
  }

  kardexCanConsult(): boolean {
    return !!this.selectedProduct && this.kardexDatesValid();
  }

  movementTypeClass(type: string): string {
    return type === 'IN' ? 'badge--in' : 'badge--out';
  }

  // ── Movimientos ──────────────────────────────────────────────────────────

  loadMovements(): void {
    if (!this.datesValid(this.movFromCtrl.value, this.movToCtrl.value)) return;
    this.movLoading = true;
    this.cdr.markForCheck();
    this.reportService.getMovementsSummary(
      this.toIsoDate(this.movFromCtrl.value),
      this.toIsoDate(this.movToCtrl.value),
    ).pipe(
      finalize(() => { this.movLoading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: data => { this.movSummary = data; this.cdr.markForCheck(); },
      error: () => this.snackBar.open('Error al cargar resumen de movimientos', 'Cerrar',
        { duration: 5000, panelClass: ['snackbar-error'] }),
    });
  }

  netMovementPositive(): boolean { return (this.movSummary?.netMovement ?? 0) > 0; }
  netMovementNegative(): boolean { return (this.movSummary?.netMovement ?? 0) < 0; }

  // ── Rotación ─────────────────────────────────────────────────────────────

  loadTurnover(): void {
    if (!this.datesValid(this.turnFromCtrl.value, this.turnToCtrl.value)) return;
    this.turnLoading = true;
    this.cdr.markForCheck();
    this.reportService.getInventoryTurnover(
      this.toIsoDate(this.turnFromCtrl.value),
      this.toIsoDate(this.turnToCtrl.value),
    ).pipe(
      finalize(() => { this.turnLoading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: items => { this.turnoverItems = items; this.turnoverQueried = true; this.cdr.markForCheck(); },
      error: () => this.snackBar.open('Error al cargar rotación de inventario', 'Cerrar',
        { duration: 5000, panelClass: ['snackbar-error'] }),
    });
  }

  interpretationClass(interp: TurnoverInterpretation): string {
    const map: Record<string, string> = {
      'Alta':     'badge--alta',
      'Media':    'badge--media',
      'Baja':     'badge--baja',
      'Sin datos':'badge--sin-datos',
    };
    return map[interp] ?? 'badge--sin-datos';
  }

  // ── Utilidades ───────────────────────────────────────────────────────────

  private datesValid(from: Date | null, to: Date | null): boolean {
    if (from && to) return from <= to;
    return true;
  }

  private toIsoDate(d: Date | null): string | undefined {
    if (!d) return undefined;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  datesInvalidError(from: Date | null, to: Date | null): boolean {
    return !!from && !!to && from > to;
  }
}
