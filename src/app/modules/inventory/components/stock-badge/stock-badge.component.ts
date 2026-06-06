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

  get level(): 'success' | 'warning' | 'error' {
    if (this.currentStock === 0)                       return 'error';
    if (this.currentStock <= this.minimumStock)        return 'warning';
    return 'success';
  }

  get tooltipText(): string {
    const s = this.currentStock;
    const m = this.minimumStock;
    if (s === 0)      return `Sin stock (mínimo: ${m})`;
    if (s <= m)       return `Bajo stock — actual: ${s}, mínimo: ${m}`;
    return `Stock OK — actual: ${s}, mínimo: ${m}`;
  }
}
