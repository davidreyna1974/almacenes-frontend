import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-reservations-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="placeholder-page">
      <h1>Reservas de stock</h1>
      <p>Próximamente — FASE 5 del módulo Sales.</p>
    </div>
  `,
  styles: [`
    .placeholder-page { padding: var(--space-3); }
  `],
})
export class ReservationsPageComponent {}
