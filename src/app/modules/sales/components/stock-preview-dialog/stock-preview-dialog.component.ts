import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface StockPreviewItem {
  productSku:  string;
  productName: string;
  quantity:    number;
  available:   number;
}

export interface StockPreviewDialogData {
  title:          string;
  message:        string;
  availableLabel: string;
  items:          StockPreviewItem[];
  confirmLabel?:  string;
  cancelLabel?:   string;
  warningNote?:   string;
}

@Component({
  selector: 'app-stock-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './stock-preview-dialog.component.html',
  styleUrl: './stock-preview-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockPreviewDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<StockPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StockPreviewDialogData,
  ) {}

  get hasInsufficient(): boolean {
    return this.data.items.some(i => i.quantity > i.available);
  }

  confirm(): void { this.dialogRef.close(true);  }
  cancel():  void { this.dialogRef.close(false); }
}
