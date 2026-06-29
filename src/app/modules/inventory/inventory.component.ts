import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [RouterModule],
  template: `<router-outlet />`,
  styles: [`:host { display: flex; flex-direction: column; height: 100%; }`]
})
export class InventoryComponent {}
