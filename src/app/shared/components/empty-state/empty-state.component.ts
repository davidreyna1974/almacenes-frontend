import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() variant: 'empty' | 'no-results' = 'empty';

  get icon(): string {
    return this.variant === 'no-results' ? 'search_off' : 'inventory_2';
  }

  get title(): string {
    return this.variant === 'no-results' ? 'Sin resultados' : 'Sin datos';
  }

  get description(): string {
    return this.variant === 'no-results'
      ? 'Ningún registro coincide con los filtros aplicados.'
      : 'Aún no hay registros. Crea el primero con el botón +';
  }
}
