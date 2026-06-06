import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent,
    TopbarComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit {
  private layoutService = inject(LayoutService);
  collapsed$ = this.layoutService.collapsed$;

  ngOnInit(): void {
    this.layoutService.expand();
  }

  collapseIfExpanded(event: MouseEvent): void {
    if (this.layoutService.isCollapsed) return;
    const target = event.target as HTMLElement;
    if (target.closest('input, button, a, select, mat-select, mat-option, mat-paginator, mat-icon-button, [mat-button], [mat-icon-button], [mat-stroked-button], [mat-flat-button]')) return;
    this.layoutService.collapse();
  }
}
