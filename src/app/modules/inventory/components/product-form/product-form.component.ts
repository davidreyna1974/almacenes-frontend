import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductResponseDTO, ProductRequestDTO, SupplierOption } from '../../models/product.model';
import { CategoryDTO } from '../../models/category.model';

export const STATUS_OPTIONS = [
  { value: 'AVAILABLE',    label: 'Disponible' },
  { value: 'DISCONTINUED', label: 'Descontinuado' },
  { value: 'OUT_OF_STOCK', label: 'Sin stock' },
] as const;

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent implements OnChanges {
  @Input() item: ProductResponseDTO | null = null;
  @Input() categories: CategoryDTO[] = [];
  @Input() suppliers: SupplierOption[] = [];
  @Input() saving = false;
  @Input() canDeactivate = false;
  @Output() save       = new EventEmitter<ProductRequestDTO>();
  @Output() cancel     = new EventEmitter<void>();
  @Output() deactivate = new EventEmitter<void>();

  readonly statusOptions = STATUS_OPTIONS;

  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    sku:          ['', [Validators.required, Validators.maxLength(50)]],
    name:         ['', [Validators.required, Validators.maxLength(150)]],
    description:  ['', Validators.maxLength(500)],
    price:        [null, [Validators.required, Validators.min(0.01)]],
    unitCost:     [null, [Validators.required, Validators.min(0.01)]],
    currentStock: [0,   [Validators.required, Validators.min(0)]],
    minimumStock: [0,   [Validators.required, Validators.min(0)]],
    status:       ['AVAILABLE', Validators.required],
    categoryId:   [null, Validators.required],
    supplierId:   [null, Validators.required],
  });

  get isEdit(): boolean { return this.item !== null; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item']) {
      this.form.reset({
        sku:          this.item?.sku          ?? '',
        name:         this.item?.name         ?? '',
        description:  this.item?.description  ?? '',
        price:        this.item?.price        ?? null,
        unitCost:     this.item?.unitCost     ?? null,
        currentStock: this.item?.currentStock ?? 0,
        minimumStock: this.item?.minimumStock ?? 0,
        status:       this.item?.status       ?? 'AVAILABLE',
        categoryId:   this.item?.categoryId   ?? null,
        supplierId:   this.item?.supplierId   ?? null,
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.value as ProductRequestDTO);
  }
}
