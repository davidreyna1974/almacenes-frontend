import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-clients-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="placeholder-page">
      <h1>Clientes</h1>
      <p>Próximamente — FASE 2 del módulo Sales.</p>
    </div>
  `,
  styles: [`
    .placeholder-page { padding: var(--space-3); }
  `],
})
export class ClientsPageComponent {}
