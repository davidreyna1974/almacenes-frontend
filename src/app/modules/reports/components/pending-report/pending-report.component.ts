import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pending-report',
  standalone: true,
  imports: [CommonModule],
  template: `<p>Operaciones Pendientes — en desarrollo</p>`,
})
export class PendingReportComponent {}
