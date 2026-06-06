import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CategoryDTO } from '../../models/category.model';

@Component({
  selector: 'app-category-info-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="cat-info">
      <div class="cat-info__header">
        <mat-icon class="cat-info__header-icon" aria-hidden="true">category</mat-icon>
        <h2 class="cat-info__title">Información de categoría</h2>
        <button mat-icon-button (click)="close()" aria-label="Cerrar diálogo">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="cat-info__body">
        <dl class="cat-info__fields">
          <dt>Nombre</dt>
          <dd>{{ data.name }}</dd>

          <dt>Descripción</dt>
          <dd>{{ data.description || '—' }}</dd>

          <dt>Creada por</dt>
          <dd>{{ data.createdByUsername || '—' }}</dd>

          <dt>Fecha de creación</dt>
          <dd>{{ data.createdAt | date:'dd/MM/yyyy HH:mm' }}</dd>
        </dl>
      </div>

      <div class="cat-info__footer">
        <button mat-flat-button color="primary" (click)="close()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .cat-info__header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 24px 24px 16px;
      border-bottom: 1px solid var(--color-divider);
    }
    .cat-info__header-icon {
      color: var(--color-primary);
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .cat-info__title {
      flex: 1;
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .cat-info__body { padding: 24px 28px; }
    .cat-info__fields {
      display: grid;
      grid-template-columns: 160px 1fr;
      gap: 16px 20px;
      margin: 0;
    }
    .cat-info__fields dt {
      font-weight: 600;
      font-size: 1rem;
      color: var(--color-text-secondary);
      padding-top: 1px;
    }
    .cat-info__fields dd {
      margin: 0;
      font-size: 1rem;
      color: var(--color-text-primary);
    }
    .cat-info__footer {
      display: flex;
      justify-content: flex-end;
      padding: 14px 24px 24px;
      border-top: 1px solid var(--color-divider);
    }
  `]
})
export class CategoryInfoDialogComponent {
  data      = inject<CategoryDTO>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<CategoryInfoDialogComponent>);

  close(): void { this.dialogRef.close(); }
}
