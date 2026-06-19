import {
  Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReportService } from '../../services/report.service';
import { ExecutiveDashboardDTO, InventoryValuationDTO } from '../../models/report.model';

@Component({
  selector: 'app-executive-dashboard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    BaseChartDirective,
    MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatProgressBarModule, MatTooltipModule,
  ],
  templateUrl: './executive-dashboard.component.html',
  styleUrl: './executive-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutiveDashboardComponent implements OnInit {
  private reportService = inject(ReportService);
  private snackBar      = inject(MatSnackBar);
  private router        = inject(Router);
  private cdr           = inject(ChangeDetectorRef);
  private destroyRef    = inject(DestroyRef);

  fromCtrl = new FormControl<Date | null>(null);
  toCtrl   = new FormControl<Date | null>(null);

  loading = false;
  execData: ExecutiveDashboardDTO | null = null;
  valuationData: InventoryValuationDTO | null = null;

  donutChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  donutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: ctx => {
            const val = ctx.parsed;
            const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
            return `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2 })} (${pct}%)`;
          },
        },
      },
    },
  };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    forkJoin({
      exec:      this.reportService.getExecutiveDashboard(
                   this.toIsoDate(this.fromCtrl.value),
                   this.toIsoDate(this.toCtrl.value),
                 ).pipe(catchError(() => of(null))),
      valuation: this.reportService.getInventoryValuation()
                   .pipe(catchError(() => of(null))),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.loading = false; this.cdr.markForCheck(); })
    ).subscribe(({ exec, valuation }) => {
      this.execData      = exec;
      this.valuationData = valuation;
      if (valuation && valuation.categories?.length) this.buildDonut(valuation);
      if (!exec && !valuation) {
        this.snackBar.open('Error al cargar el dashboard ejecutivo', 'Cerrar',
          { duration: 5000, panelClass: ['snackbar-error'] });
      }
      this.cdr.markForCheck();
    });
  }

  private buildDonut(data: InventoryValuationDTO): void {
    const palette = [
      '#6B3C6B','#CE6EEB','#9B4FAB','#4A2850','#B850D4',
      '#E8C6F8','#7C3AED','#A855F7',
    ];
    const sorted = [...data.categories].sort((a, b) => b.categoryValue - a.categoryValue);
    this.donutChartData = {
      labels: sorted.map(c => c.categoryName),
      datasets: [{
        data:            sorted.map(c => c.categoryValue),
        backgroundColor: sorted.map((_, i) => palette[i % palette.length]),
        hoverOffset: 6,
      }],
    };
  }

  datesValid(): boolean {
    const f = this.fromCtrl.value, t = this.toCtrl.value;
    if (f && t) return f <= t;
    return true;
  }

  datesInvalidError(): boolean {
    const f = this.fromCtrl.value, t = this.toCtrl.value;
    return !!f && !!t && f > t;
  }

  navigateTo(path: string): void { this.router.navigate([path]); }

  private toIsoDate(d: Date | null): string | undefined {
    if (!d) return undefined;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
