import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClientDTO, ClientRequest } from '../../models/client.model';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFormComponent implements OnChanges {
  @Input() item: ClientDTO | null = null;
  @Input() canWrite = false;
  @Input() canDeactivate = false;
  @Input() saving = false;

  @Output() save       = new EventEmitter<ClientRequest>();
  @Output() cancel     = new EventEmitter<void>();
  @Output() deactivate = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(150)]],
    rfc:         ['', Validators.maxLength(13)],
    contactName: ['', Validators.maxLength(100)],
    phone:       ['', Validators.maxLength(20)],
    email:       ['', [Validators.email, Validators.maxLength(100)]],
    address:     [''],
  });

  get isEdit(): boolean { return this.item !== null; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item']) {
      this.form.reset({
        name:        this.item?.name        ?? '',
        rfc:         this.item?.rfc         ?? '',
        contactName: this.item?.contactName ?? '',
        phone:       this.item?.phone       ?? '',
        email:       this.item?.email       ?? '',
        address:     this.item?.address     ?? '',
      });
    }
    if (changes['canWrite']) {
      this.canWrite ? this.form.enable() : this.form.disable();
    }
  }

  submit(): void {
    if (this.form.invalid || !this.canWrite) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.save.emit({
      name:        v.name!,
      rfc:         v.rfc         || null,
      contactName: v.contactName || null,
      phone:       v.phone       || null,
      email:       v.email       || null,
      address:     v.address     || null,
    });
  }
}
