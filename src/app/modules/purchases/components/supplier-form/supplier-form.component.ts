import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupplierDTO } from '../../models/supplier.model';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule,
  ],
  templateUrl: './supplier-form.component.html',
  styleUrl: './supplier-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierFormComponent implements OnChanges {
  @Input() supplier: SupplierDTO | null = null;
  @Input() isEdit = false;
  @Input() canWrite = false;
  @Input() canDeactivate = false;
  @Input() loading = false;

  @Output() save       = new EventEmitter<SupplierDTO>();
  @Output() cancel     = new EventEmitter<void>();
  @Output() deactivate = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  form = this.fb.group({
    rfc:         ['', [Validators.required, Validators.maxLength(13)]],
    companyName: ['', [Validators.required, Validators.maxLength(150)]],
    contactName: ['', Validators.maxLength(100)],
    phone:       ['', Validators.maxLength(20)],
    email:       ['', [Validators.email, Validators.maxLength(100)]],
    address:     [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['supplier'] && this.supplier) {
      this.form.patchValue({
        rfc:         this.supplier.rfc         ?? '',
        companyName: this.supplier.companyName ?? '',
        contactName: this.supplier.contactName ?? '',
        phone:       this.supplier.phone       ?? '',
        email:       this.supplier.email       ?? '',
        address:     this.supplier.address     ?? '',
      });
    }
    if (changes['canWrite']) {
      this.canWrite ? this.form.enable() : this.form.disable();
    }
  }

  submit(): void {
    if (this.form.invalid || !this.canWrite) return;
    const v = this.form.getRawValue();
    this.save.emit({
      id:          this.supplier?.id ?? null,
      rfc:         v.rfc!,
      companyName: v.companyName!,
      contactName: v.contactName || null,
      phone:       v.phone       || null,
      email:       v.email       || null,
      address:     v.address     || null,
      active:      this.supplier?.active ?? true,
      createdAt: null, createdById: null, createdByUsername: null,
      updatedAt: null, updatedById: null, updatedByUsername: null,
    });
  }
}
