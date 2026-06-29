import {
  Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReportService } from '../../services/report.service';
import {
  SalesProfitabilityDTO, TopProductDTO, AbcProductDTO,
  PurchaseBySupplierDTO, SalesTrendItemDTO, TrendGroupBy, AbcClassification,
} from '../../models/report.model';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    BaseChartDirective,
    MatTabsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatProgressBarModule, MatTooltipModule,
  ],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsDashboardComponent implements OnInit {
  private reportService = inject(ReportService);
  private snackBar      = inject(MatSnackBar);
  private cdr           = inject(ChangeDetectorRef);
  private destroyRef    = inject(DestroyRef);

  // ── Tab 0: Rentabilidad ──────────────────────────────────────────────────
  profitFromCtrl = new FormControl<Date | null>(null, Validators.required);
  profitToCtrl   = new FormControl<Date | null>(null, Validators.required);
  profitLoading  = false;
  profitData: SalesProfitabilityDTO | null = null;

  // ── Tab 1: Tendencia de ventas ───────────────────────────────────────────
  trendFromCtrl   = new FormControl<Date | null>(null);
  trendToCtrl     = new FormControl<Date | null>(null);
  trendGroupBy    = new FormControl<TrendGroupBy>('MONTH');
  trendLoading    = false;
  trendQueried    = false;
  trendItems: SalesTrendItemDTO[] = [];

  trendChartData: ChartData<'line'> = { labels: [], datasets: [] };
  trendChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: {
      x: { ticks: { maxTicksLimit: 12 } },
      y: { beginAtZero: true },
    },
  };

  readonly groupByOptions: { value: TrendGroupBy; label: string }[] = [
    { value: 'DAY',   label: 'Diario' },
    { value: 'WEEK',  label: 'Semanal' },
    { value: 'MONTH', label: 'Mensual' },
  ];

  // ── Tab 2: Top productos ──────────────────────────────────────────────────
  topFromCtrl = new FormControl<Date | null>(null);
  topToCtrl   = new FormControl<Date | null>(null);
  topLoading  = false;
  topQueried  = false;
  topItems: TopProductDTO[] = [];
  readonly topCols = ['rank', 'sku', 'name', 'totalQuantitySold', 'totalRevenue'];

  // ── Tab 3: Clasificación ABC ──────────────────────────────────────────────
  abcFromCtrl = new FormControl<Date | null>(null);
  abcToCtrl   = new FormControl<Date | null>(null);
  abcLoading  = false;
  abcQueried  = false;
  abcItems: AbcProductDTO[] = [];
  readonly abcCols = ['sku', 'name', 'classification', 'totalRevenue', 'revenuePct', 'cumulativePct'];

  // ── Tab 4: Por proveedor ──────────────────────────────────────────────────
  supplierFromCtrl = new FormControl<Date | null>(null);
  supplierToCtrl   = new FormControl<Date | null>(null);
  supplierLoading  = false;
  supplierQueried  = false;
  supplierItems: PurchaseBySupplierDTO[] = [];
  readonly supplierCols = ['supplierName', 'orderCount', 'totalAmount', 'lastOrderDate'];

  ngOnInit(): void {}

  // ── Rentabilidad ──────────────────────────────────────────────────────────

  profitDatesValid(): boolean {
    const f = this.profitFromCtrl.value, t = this.profitToCtrl.value;
    return !!f && !!t && f <= t;
  }

  loadProfitability(): void {
    if (!this.profitDatesValid()) return;
    this.profitLoading = true;
    this.cdr.markForCheck();
    this.reportService.getSalesProfitability(
      this.toIsoDate(this.profitFromCtrl.value)!,
      this.toIsoDate(this.profitToCtrl.value)!,
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.profitLoading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: data => { this.profitData = data; this.cdr.markForCheck(); },
      error: () => this.snackBar.open('Error al calcular rentabilidad. Verifique el período.', 'Cerrar',
        { duration: 5000, panelClass: ['snackbar-error'] }),
    });
  }

  formatPct(val: number | null): string {
    return val !== null ? `${val.toFixed(2)}%` : '—';
  }

  // ── Tendencia ─────────────────────────────────────────────────────────────

  loadTrend(): void {
    if (!this.trendDatesValid()) return;
    this.trendLoading = true;
    this.cdr.markForCheck();
    this.reportService.getSalesTrend(
      this.toIsoDate(this.trendFromCtrl.value),
      this.toIsoDate(this.trendToCtrl.value),
      this.trendGroupBy.value ?? 'MONTH',
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.trendLoading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: items => {
        this.trendItems = items;
        this.trendQueried = true;
        this.buildTrendChart(items);
        this.cdr.markForCheck();
      },
      error: () => this.snackBar.open('Error al cargar tendencia de ventas', 'Cerrar',
        { duration: 5000, panelClass: ['snackbar-error'] }),
    });
  }

  private buildTrendChart(items: SalesTrendItemDTO[]): void {
    const groupBy = this.trendGroupBy.value ?? 'MONTH';
    this.trendChartData = {
      labels: items.map(i => this.formatPeriod(i.period, groupBy)),
      datasets: [
        {
          label: 'Ingresos (S/)',
          data: items.map(i => i.revenue),
          borderColor: '#6B3C6B',
          backgroundColor: 'rgba(107,60,107,0.12)',
          fill: true,
          tension: 0.3,
          yAxisID: 'y',
        },
        {
          label: 'Órdenes',
          data: items.map(i => i.orderCount),
          borderColor: '#CE6EEB',
          backgroundColor: 'rgba(206,110,235,0.08)',
          fill: false,
          tension: 0.3,
          yAxisID: 'y1',
        },
      ],
    };
    this.trendChartOptions = {
      ...this.trendChartOptions,
      scales: {
        x: { ticks: { maxTicksLimit: 12 } },
        y:  { beginAtZero: true, position: 'left',  title: { display: true, text: 'S/' } },
        y1: { beginAtZero: true, position: 'right', title: { display: true, text: 'Órdenes' }, grid: { drawOnChartArea: false } },
      },
    };
  }

  private formatPeriod(period: string, groupBy: TrendGroupBy): string {
    const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    if (groupBy === 'MONTH') {
      const [y, m] = period.split('-');
      return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
    }
    if (groupBy === 'WEEK') {
      const [y, w] = period.split('-');
      return `Sem ${parseInt(w, 10)}/${y}`;
    }
    const [, m, d] = period.split('-');
    return `${parseInt(d, 10)} ${monthNames[parseInt(m, 10) - 1]}`;
  }

  trendDatesValid(): boolean {
    return this.datesValid(this.trendFromCtrl.value, this.trendToCtrl.value);
  }

  // ── Top productos ─────────────────────────────────────────────────────────

  loadTopProducts(): void {
    if (!this.datesValid(this.topFromCtrl.value, this.topToCtrl.value)) return;
    this.topLoading = true;
    this.cdr.markForCheck();
    this.reportService.getTopProducts(
      this.toIsoDate(this.topFromCtrl.value),
      this.toIsoDate(this.topToCtrl.value),
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.topLoading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: items => { this.topItems = items; this.topQueried = true; this.cdr.markForCheck(); },
      error: () => this.snackBar.open('Error al cargar top productos', 'Cerrar',
        { duration: 5000, panelClass: ['snackbar-error'] }),
    });
  }

  medalIcon(idx: number): string {
    const medals = ['emoji_events', 'military_tech', 'workspace_premium'];
    return medals[idx] ?? '';
  }

  medalClass(idx: number): string {
    const cls = ['medal--gold', 'medal--silver', 'medal--bronze'];
    return cls[idx] ?? '';
  }

  // ── ABC ───────────────────────────────────────────────────────────────────

  loadAbc(): void {
    if (!this.datesValid(this.abcFromCtrl.value, this.abcToCtrl.value)) return;
    this.abcLoading = true;
    this.cdr.markForCheck();
    this.reportService.getAbcAnalysis(
      this.toIsoDate(this.abcFromCtrl.value),
      this.toIsoDate(this.abcToCtrl.value),
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.abcLoading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: items => { this.abcItems = items; this.abcQueried = true; this.cdr.markForCheck(); },
      error: () => this.snackBar.open('Error al cargar clasificación ABC', 'Cerrar',
        { duration: 5000, panelClass: ['snackbar-error'] }),
    });
  }

  abcClass(cls: AbcClassification): string {
    const map: Record<string, string> = { A: 'abc--a', B: 'abc--b', C: 'abc--c' };
    return map[cls] ?? '';
  }

  // ── Por proveedor ─────────────────────────────────────────────────────────

  loadBySupplier(): void {
    if (!this.datesValid(this.supplierFromCtrl.value, this.supplierToCtrl.value)) return;
    this.supplierLoading = true;
    this.cdr.markForCheck();
    this.reportService.getPurchasesBySupplier(
      this.toIsoDate(this.supplierFromCtrl.value),
      this.toIsoDate(this.supplierToCtrl.value),
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.supplierLoading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: items => { this.supplierItems = items; this.supplierQueried = true; this.cdr.markForCheck(); },
      error: () => this.snackBar.open('Error al cargar ventas por proveedor', 'Cerrar',
        { duration: 5000, panelClass: ['snackbar-error'] }),
    });
  }

  isTopSupplier(row: PurchaseBySupplierDTO): boolean {
    return this.supplierItems.length > 0 && row === this.supplierItems[0];
  }

  // ── Utilidades ────────────────────────────────────────────────────────────

  private datesValid(from: Date | null, to: Date | null): boolean {
    if (from && to) return from <= to;
    return true;
  }

  datesInvalidError(from: Date | null, to: Date | null): boolean {
    return !!from && !!to && from > to;
  }

  private toIsoDate(d: Date | null): string | undefined {
    if (!d) return undefined;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
