import { Component, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryService } from '../../services/category.service';
import { CategoryDTO, CategoryRequest } from '../../models/category.model';
import { CategoryFormComponent } from '../category-form/category-form.component';

export interface CategoryDialogData {
  item: CategoryDTO | null;
}

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  imports: [MatDialogModule, CategoryFormComponent],
  template: `
    <app-category-form
      [item]="data.item"
      [saving]="saving"
      (save)="onSave($event)"
      (cancel)="dialogRef.close(false)" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormDialogComponent {
  readonly data      = inject<CategoryDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<CategoryFormDialogComponent>);
  private categoryService = inject(CategoryService);
  private snackBar   = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private cdr        = inject(ChangeDetectorRef);

  saving = false;

  onSave(request: CategoryRequest): void {
    this.saving = true;
    this.cdr.markForCheck();

    const op$ = this.data.item
      ? this.categoryService.update(this.data.item.id, request)
      : this.categoryService.create(request);

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        const msg = this.data.item ? 'Categoría actualizada correctamente.' : 'Categoría creada correctamente.';
        this.snackBar.open(msg, 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        this.cdr.detectChanges();
        const msg = err.error?.message || 'Error al guardar la categoría.';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: ['snackbar-error'] });
      }
    });
  }
}
