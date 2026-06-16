import { Routes } from '@angular/router';
import { ReportsComponent } from './reports.component';
import { PendingReportComponent } from './components/pending-report/pending-report.component';
import { OperationalReportComponent } from './components/operational-report/operational-report.component';
import { AnalyticsDashboardComponent } from './components/analytics-dashboard/analytics-dashboard.component';
import { ExecutiveDashboardComponent } from './components/executive-dashboard/executive-dashboard.component';
import { authGuard } from '../../core/auth/auth.guard';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    component: ReportsComponent,
    children: [
      { path: '', redirectTo: 'pending', pathMatch: 'full' },
      {
        path: 'pending',
        component: PendingReportComponent,
      },
      {
        path: 'operational',
        component: OperationalReportComponent,
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN'] },
      },
      {
        path: 'analytics',
        component: AnalyticsDashboardComponent,
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] },
      },
      {
        path: 'executive',
        component: ExecutiveDashboardComponent,
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN'] },
      },
    ]
  }
];
