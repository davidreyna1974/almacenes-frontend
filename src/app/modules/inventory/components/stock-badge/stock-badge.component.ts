import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-stock-badge',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './stock-badge.component.html',
  styleUrl: './stock-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockBadgeComponent {
  @Input({ required: true }) currentStock!: number;
  @Input({ required: true }) minimumStock!: number;
  @Input() reservedStock = 0;

  get availableStock(): number {
    return this.currentStock - this.reservedStock;
  }

  get level(): 'success' | 'warning' | 'error' {
    if (this.currentStock === 0)                       return 'error';
    if (this.currentStock <= this.minimumStock)        return 'warning';
    return 'success';
  }

  get tooltipText(): string {
    const s = this.currentStock;
    const m = this.minimumStock;
    const r = this.reservedStock;
    const a = this.availableStock;

    if (s === 0) return `Sin stock · Mínimo: ${m}`;

    const reservedNote = r > 0
      ? ` · Reservado: ${r} · Disponible: ${a}`
      : '';

    if (s <= m) return `Bajo stock · Físico: ${s}${reservedNote} · Mínimo: ${m}`;
    return `Stock OK · Físico: ${s}${reservedNote} · Mínimo: ${m}`;
  }
}
