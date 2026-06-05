import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { LayoutService } from '../layout.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  private layoutService = inject(LayoutService);
  private authService = inject(AuthService);

  get userName(): string { return this.authService.getUsername(); }
  get userRole(): string { return this.authService.getPrimaryRole(); }

  toggle(): void { this.layoutService.toggle(); }
  logout(): void { this.authService.logout(); }

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
