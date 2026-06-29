import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ReservationService } from '../../services/reservation.service';
import { ReservationSummary, ReservedProduct, ReservedClient } from '../../models/reservation.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LayoutService } from '../../../../core/layout/layout.service';

const EMPTY_SUMMARY: ReservationSummary = {
  totalProductsWithReservations: 0,
  totalReservedUnits: 0,
  totalReservedValue: 0,
  totalApprovedOrders: 0,
};

@Component({
  selector: 'app-reservations-page',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
    EmptyStateComponent,
  ],
  templateUrl: './reservations-page.component.html',
  styleUrl: './reservations-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('150ms ease-in-out')),
    ]),
  ],
})
export class ReservationsPageComponent implements OnInit {
  private reservationService = inject(ReservationService);
  private layoutService = inject(LayoutService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  readonly productColumns = ['productSku', 'productName', 'totalReservedQty', 'unitPrice', 'totalReservedValue'];
  readonly clientColumns = ['clientName', 'totalReservedOrders', 'totalReservedValue'];

  summary: ReservationSummary = EMPTY_SUMMARY;
  products: ReservedProduct[] = [];
  clients: ReservedClient[] = [];

  expandedProductId: number | null = null;
  expandedClientId: number | null = null;

  loading = true;

  ngOnInit(): void {
    setTimeout(() => this.layoutService.collapse(), 0);

    forkJoin({
      summary: this.reservationService.getSummary().pipe(catchError(() => of(EMPTY_SUMMARY))),
      products: this.reservationService.getProducts().pipe(catchError(() => of([] as ReservedProduct[]))),
      clients: this.reservationService.getClients().pipe(catchError(() => of([] as ReservedClient[]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ summary, products, clients }) => {
        this.summary = summary;
        this.products = products;
        this.clients = clients;
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  toggleProduct(row: ReservedProduct): void {
    this.expandedProductId = this.expandedProductId === row.productId ? null : row.productId;
  }

  toggleClient(row: ReservedClient): void {
    this.expandedClientId = this.expandedClientId === row.clientId ? null : row.clientId;
  }

  goToOrder(orderId: number): void {
    this.router.navigate(['/sales/orders', orderId], { queryParams: { from: 'reservations' } });
  }
}
