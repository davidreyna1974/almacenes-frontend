import {
  Component, OnInit, Inject, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ProductService } from '../../../inventory/services/product.service';
import { ProductResponseDTO } from '../../../inventory/models/product.model';
import {
  SaleOrderDetailResponse,
  SaleOrderDetailRequest,
  SaleOrderDetailUpdateRequest,
} from '../../models/sale-order.model';

export interface SaleOrderDetailFormData {
  detail:             SaleOrderDetailResponse | null;
  existingProductIds: number[];
}

export type SaleOrderDetailFormResult =
  | { mode: 'create'; dto: SaleOrderDetailRequest; productSku: string; productName: string }
  | { mode: 'edit';   dto: SaleOrderDetailUpdateRequest };

@Component({
  selector: 'app-sale-order-detail-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatAutocompleteModule,
    MatButtonModule, MatIconModule,
  ],
  templateUrl: './sale-order-detail-form.component.html',
  styleUrl: './sale-order-detail-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleOrderDetailFormComponent implements OnInit {
  private productService = inject(ProductService);
  private fb             = inject(FormBuilder);
  private cdr            = inject(ChangeDetectorRef);
  private destroyRef     = inject(DestroyRef);

  products: ProductResponseDTO[] = [];
  filteredProducts: ProductResponseDTO[] = [];
  selectedProduct: ProductResponseDTO | null = null;
  subtotal = 0;

  get isEdit(): boolean { return this.data.detail !== null; }

  form = this.fb.group({
    productSearch: [''],
    quantity:  [1,    [Validators.required, Validators.min(1)]],
    unitPrice: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  constructor(
    public dialogRef: MatDialogRef<SaleOrderDetailFormComponent, SaleOrderDetailFormResult | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: SaleOrderDetailFormData,
  ) {}

  ngOnInit(): void {
    this.productService.search({ size: 200 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(page => {
        this.products = page.content.filter(p => p.active);
        this.filteredProducts = [...this.products];
        this.cdr.markForCheck();
      });

    if (this.data.detail) {
      this.form.patchValue({
        productSearch: `[${this.data.detail.productSku}] — ${this.data.detail.productName}`,
        quantity:  this.data.detail.quantity,
        unitPrice: this.data.detail.unitPrice,
      });
      this.form.get('productSearch')!.disable();
      this.subtotal = this.data.detail.quantity * this.data.detail.unitPrice;
    }

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => {
      const q = v.quantity  ?? 0;
      const p = v.unitPrice ?? 0;
      this.subtotal = q * p;
      this.cdr.markForCheck();
    });

    this.form.get('productSearch')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.filterProducts(term ?? ''));
  }

  private normalize(s: string): string {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  private filterProducts(term: string | unknown): void {
    if (typeof term !== 'string') return;
    const q = this.normalize(term);
    this.filteredProducts = this.products.filter(p =>
      this.normalize(p.sku).includes(q) || this.normalize(p.name).includes(q)
    );
    this.cdr.markForCheck();
  }

  onProductSelected(product: ProductResponseDTO): void {
    this.selectedProduct = product;
    this.form.patchValue({ unitPrice: product.price }, { emitEvent: false });
    this.subtotal = (this.form.value.quantity ?? 1) * product.price;
    this.cdr.markForCheck();
  }

  displayProduct(productOrStr: ProductResponseDTO | string | null): string {
    if (!productOrStr) return '';
    if (typeof productOrStr === 'string') return productOrStr;
    return `[${productOrStr.sku}] — ${productOrStr.name}`;
  }

  isProductDisabled(product: ProductResponseDTO): boolean {
    return this.data.existingProductIds.includes(product.id);
  }

  get currentProduct(): ProductResponseDTO | null {
    if (this.selectedProduct) return this.selectedProduct;
    if (this.data.detail) return this.products.find(p => p.id === this.data.detail!.productId) ?? null;
    return null;
  }

  get quantityExceedsAvailable(): boolean {
    const product = this.currentProduct;
    const qty = this.form.value.quantity ?? 0;
    return !!product && qty > product.availableStock;
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();

    if (this.isEdit) {
      this.dialogRef.close({
        mode: 'edit',
        dto: { quantity: v.quantity!, unitPrice: v.unitPrice! },
      });
    } else {
      if (!this.selectedProduct) return;
      this.dialogRef.close({
        mode: 'create',
        dto: { productId: this.selectedProduct.id, quantity: v.quantity!, unitPrice: v.unitPrice! },
        productSku:  this.selectedProduct.sku,
        productName: this.selectedProduct.name,
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
