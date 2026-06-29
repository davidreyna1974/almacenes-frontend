import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  private readonly labels: Record<string, string> = {
    PENDING:   'Pendiente',
    APPROVED:  'Aprobado',
    RECEIVED:  'Recibido',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
    ACTIVE:    'Activo',
    INACTIVE:  'Inactivo',
  };

  transform(value: string): string {
    return this.labels[value] ?? value;
  }
}
