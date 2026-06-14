import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ClientService } from '../../services/client.service';
import { ClientDTO } from '../../models/client.model';
import { PageResponse } from '../../../../shared/models/page-response.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { LayoutService } from '../../../../core/layout/layout.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ClientFormDialogComponent, ClientDialogData } from '../client-form-dialog/client-form-dialog.component';

const DIALOG_CONFIG = {
  width:         '640px',
  maxWidth:      '92vw',
  maxHeight:     '80vh',
  position:      { top: '64px' },
  backdropClass: 'catalog-backdrop',
  panelClass:    'catalog-form-dialog',
  disableClose:  true,
};

@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    EmptyStateComponent,
  ],
  templateUrl: './clients-page.component.html',
  styleUrl: './clients-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsPageComponent implements OnInit {
  private clientService = inject(ClientService);
  private authService   = inject(AuthService);
  private layoutService = inject(LayoutService);
  private dialog        = inject(MatDialog);
  private snackBar      = inject(MatSnackBar);
  private destroyRef    = inject(DestroyRef);
  private cdr           = inject(ChangeDetectorRef);

  displayedColumns = ['name', 'rfc', 'contactName', 'phone', 'email'];

  searchCtrl = new FormControl('');

  clients: ClientDTO[] = [];
  page: PageResponse<ClientDTO> | null = null;
  currentPage = 0;
  pageSize    = 20;
  loading     = false;

  canManage():     boolean { return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER') || this.authService.hasRole('ROLE_SALES'); }
  canDeactivate(): boolean { return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_MANAGER'); }

  ngOnInit(): void {
    setTimeout(() => this.layoutService.collapse(), 0);
    this.load();

    this.searchCtrl.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.currentPage = 0;
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.clientService.getActive(this.searchCtrl.value ?? '', this.currentPage, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.page    = page;
          this.clients = page.content;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
          this.snackBar.open('Error al cargar clientes.', 'Cerrar', { duration: 4000, panelClass: ['snackbar-error'] });
        }
      });
  }

  clearSearch(): void {
    this.searchCtrl.setValue('');
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize    = event.pageSize;
    this.load();
  }

  openNew(): void {
    const data: ClientDialogData = { item: null, canWrite: this.canManage(), canDeactivate: false };
    this.dialog.open(ClientFormDialogComponent, { ...DIALOG_CONFIG, data })
      .afterClosed()
      .pipe(filter(r => r === true), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }

  openDetail(item: ClientDTO): void {
    const data: ClientDialogData = { item, canWrite: this.canManage(), canDeactivate: this.canDeactivate() };
    this.dialog.open(ClientFormDialogComponent, { ...DIALOG_CONFIG, data })
      .afterClosed()
      .pipe(filter(r => r === true), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }

  onRowClick(item: ClientDTO): void {
    this.openDetail(item);
  }
}
