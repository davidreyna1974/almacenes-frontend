import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ReservationSummary, ReservedProduct, ReservedClient } from '../models/reservation.model';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly api = `${environment.apiUrl}/sales/reservations`;
  private http = inject(HttpClient);

  getSummary(): Observable<ReservationSummary> {
    return this.http.get<ReservationSummary>(`${this.api}/summary`);
  }

  getProducts(): Observable<ReservedProduct[]> {
    return this.http.get<ReservedProduct[]>(`${this.api}/products`);
  }

  getProductById(id: number): Observable<ReservedProduct> {
    return this.http.get<ReservedProduct>(`${this.api}/products/${id}`);
  }

  getClients(): Observable<ReservedClient[]> {
    return this.http.get<ReservedClient[]>(`${this.api}/clients`);
  }

  getClientById(id: number): Observable<ReservedClient> {
    return this.http.get<ReservedClient>(`${this.api}/clients/${id}`);
  }
}
