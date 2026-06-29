import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title:          string;
  message:        string;
  confirmLabel?:  string;
  cancelLabel?:   string;
  dangerous?:     boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  get confirmLabel(): string { return this.data.confirmLabel ?? 'Confirmar'; }
  get cancelLabel():  string { return this.data.cancelLabel  ?? 'Cancelar'; }

  confirm(): void { this.dialogRef.close(true);  }
  cancel():  void { this.dialogRef.close(false); }
}
