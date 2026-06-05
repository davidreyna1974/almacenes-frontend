import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  private layoutService = inject(LayoutService);

  // Placeholder hasta Módulo 1 donde AuthService provee estos datos
  readonly userName = 'Usuario';
  readonly userRole = 'ADMIN';

  toggle(): void {
    this.layoutService.toggle();
  }

  getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      ADMIN:        'var(--color-role-admin)',
      MANAGER:      'var(--color-role-manager)',
      WAREHOUSEMAN: 'var(--color-role-warehouseman)',
      SALES:        'var(--color-role-sales)',
    };
    return colors[role] ?? 'var(--color-text-secondary)';
  }
}
