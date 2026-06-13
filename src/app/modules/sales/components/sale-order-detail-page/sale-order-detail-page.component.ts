import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-sale-order-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="placeholder-page">
      <h1>Detalle de orden de venta</h1>
      <p>Próximamente — FASE 4 del módulo Sales.</p>
    </div>
  `,
  styles: [`
    .placeholder-page { padding: var(--space-3); }
  `],
})
export class SaleOrderDetailPageComponent {}
