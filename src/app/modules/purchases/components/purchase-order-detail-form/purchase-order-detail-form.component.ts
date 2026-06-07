import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges,
  OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ProductService } from '../../../inventory/services/product.service';
import { ProductResponseDTO } from '../../../inventory/models/product.model';
import {
  PurchaseOrderDetailRequest,
  PurchaseOrderDetailUpdateRequest,
  PurchaseOrderDetailResponse,
} from '../../models/purchase-order.model';

@Component({
  selector: 'app-purchase-order-detail-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatAutocompleteModule,
    MatButtonModule, MatIconModule,
  ],
  templateUrl: './purchase-order-detail-form.component.html',
  styleUrl: './purchase-order-detail-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderDetailFormComponent implements OnInit, OnChanges {
  // Para agregar detalle (sin detail existente) o editar (con detail)
  @Input() detail: PurchaseOrderDetailResponse | null = null;
  // IDs ya presentes en la orden — para deshabilitar en el autocomplete
  @Input() existingProductIds: number[] = [];

  @Output() save   = new EventEmitter<PurchaseOrderDetailRequest | PurchaseOrderDetailUpdateRequest>();
  @Output() cancel = new EventEmitter<void>();

  private fb             = inject(FormBuilder);
  private productService = inject(ProductService);
  private cdr            = inject(ChangeDetectorRef);
  private destroyRef     = inject(DestroyRef);

  products: ProductResponseDTO[] = [];
  filteredProducts: ProductResponseDTO[] = [];
  selectedProduct: ProductResponseDTO | null = null;
  subtotal = 0;

  get isEdit(): boolean { return this.detail !== null; }

  form = this.fb.group({
    productSearch: [''],
    quantity:  [1,    [Validators.required, Validators.min(1)]],
    unitPrice: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    this.productService.search({ size: 200 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(page => {
        this.products = page.content;
        this.filteredProducts = [...page.content];
        this.cdr.markForCheck();
      });

    // subtotal reactivo
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => {
      const q = v.quantity  ?? 0;
      const p = v.unitPrice ?? 0;
      this.subtotal = q * p;
      this.cdr.markForCheck();
    });

    // filtro del autocomplete
    this.form.get('productSearch')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.filterProducts(term ?? ''));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['detail'] && this.detail) {
      // modo edición — precargar campos editables
      this.form.patchValue({
        productSearch: `[${this.detail.productSku}] — ${this.detail.productName}`,
        quantity:  this.detail.quantity,
        unitPrice: this.detail.unitPrice,
      });
      this.form.get('productSearch')!.disable();
    }
  }

  private filterProducts(term: string): void {
    const q = term.toLowerCase();
    this.filteredProducts = this.products.filter(p =>
      p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
    this.cdr.markForCheck();
  }

  onProductSelected(product: ProductResponseDTO): void {
    this.selectedProduct = product;
    this.form.patchValue({ unitPrice: product.price }, { emitEvent: false });
    this.subtotal = (this.form.value.quantity ?? 1) * product.price;
    this.cdr.markForCheck();
  }

  displayProduct(product: ProductResponseDTO | null): string {
    if (!product) return '';
    return `[${product.sku}] — ${product.name}`;
  }

  isProductDisabled(product: ProductResponseDTO): boolean {
    return this.existingProductIds.includes(product.id);
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();

    if (this.isEdit) {
      this.save.emit({ quantity: v.quantity!, unitPrice: v.unitPrice! });
    } else {
      if (!this.selectedProduct) return;
      this.save.emit({
        productId: this.selectedProduct.id,
        quantity:  v.quantity!,
        unitPrice: v.unitPrice!,
      });
    }
  }
}
