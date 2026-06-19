import {
  Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReportService } from '../../services/report.service';
import { PendingOperationsDTO, PendingOrderSummaryDTO } from '../../models/report.model';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label.pipe';

@Component({
  selector: 'app-pending-report',
  standalone: true,
  imports: [
    CommonModule, DatePipe,
    MatTableModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatTooltipModule,
    StatusLabelPipe,
  ],
  templateUrl: './pending-report.component.html',
  styleUrl: './pending-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private router        = inject(Router);
  private snackBar      = inject(MatSnackBar);
  private cdr           = inject(ChangeDetectorRef);

  loading = false;
  data: PendingOperationsDTO | null = null;

  readonly cols = ['orderNumber', 'status', 'counterpartName', 'createdAt', 'detailCount', 'totalAmount'];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.reportService.getPendingOperations().pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: data => { this.data = data; this.cdr.markForCheck(); },
      error: () => this.snackBar.open('Error al cargar operaciones pendientes', 'Cerrar',
        { duration: 5000, panelClass: ['snackbar-error'] }),
    });
  }

  navigateToPurchase(row: PendingOrderSummaryDTO): void {
    this.router.navigate(['/purchases/orders', row.orderId]);
  }

  navigateToSale(row: PendingOrderSummaryDTO): void {
    this.router.navigate(['/sales/orders', row.orderId]);
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING:  'badge--pending',
      APPROVED: 'badge--approved',
    };
    return map[status] ?? '';
  }
}
