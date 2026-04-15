import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
export interface CheckoutRequest {
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResponse {
  checkoutUrl?: string;
  // Alguns backends retornam a propriedade como `url`; aceite ambos
  url?: string;
}

export interface PortalResponse {
  portalUrl?: string;
  // Alguns backends retornam a propriedade como `url`;
  url?: string;
}

@Injectable({ providedIn: 'root' })
export class PagamentoService {
  private readonly apiUrl = `${environment.apiUrl}/pagamentos`;

  constructor(private http: HttpClient) {}

  iniciarCheckout(): Observable<CheckoutResponse> {
    const base = window.location.origin;
    const body: CheckoutRequest = {
      successUrl: `${base}/pagamento/sucesso`,
      cancelUrl: `${base}/pagamento/cancelado`
    };
    return this.http.post<CheckoutResponse>(`${this.apiUrl}/checkout`, body);
  }

  abrirPortal(): Observable<PortalResponse> {
    return this.http.get<PortalResponse>(`${this.apiUrl}/portal`, {
      params: {
        returnUrl: `${window.location.origin}/planos`
      }
    });
  }
}
