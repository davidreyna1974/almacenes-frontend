import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-master-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './master-detail.component.html',
  styleUrl: './master-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MasterDetailComponent {
  @Input() showDetail = false;
  @Input() emptyDetailMessage = 'Selecciona un elemento para ver los detalles';
  @Output() detailClosed = new EventEmitter<void>();
}
