import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-sale-orders-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="placeholder-page">
      <h1>Órdenes de venta</h1>
      <p>Próximamente — FASE 3 del módulo Sales.</p>
    </div>
  `,
  styles: [`
    .placeholder-page { padding: var(--space-3); }
  `],
})
export class SaleOrdersPageComponent {}
