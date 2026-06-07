import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class PurchasesComponent {}
