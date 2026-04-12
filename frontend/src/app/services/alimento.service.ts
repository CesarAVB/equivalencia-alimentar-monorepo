import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Alimento } from '../models/alimento';
import { Page } from '../models/page';
import { EquivalenciaCalculada } from '../models/equivalencia-response';

@Injectable({ providedIn: 'root' })
export class AlimentoService {
  private readonly apiUrl = `${environment.apiUrl}/alimentos`;

  constructor(private http: HttpClient) {}

  listar(page = 0, size = 20, descricao?: string, grupo?: string): Observable<Page<Alimento>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (descricao) params = params.set('descricao', descricao);
    if (grupo) params = params.set('grupo', grupo);
    return this.http.get<Page<Alimento>>(this.apiUrl, { params });
  }

  listarTodos(): Observable<Page<Alimento>> {
    return this.listar(0, 200);
  }

  listarPorGrupo(grupo: string, size = 100): Observable<Page<Alimento>> {
    return this.listar(0, size, undefined, grupo);
  }

  catalogo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/catalogo`);
  }

  obterEquivalencias(alimentoId: number, quantidadeGramas?: number): Observable<EquivalenciaCalculada[]> {
    let params = new HttpParams();
    if (quantidadeGramas !== undefined && quantidadeGramas !== null) {
      params = params.set('quantidadeGramas', String(quantidadeGramas));
    }
    return this.http.get<EquivalenciaCalculada[]>(`${this.apiUrl}/${alimentoId}/equivalencias`, { params });
  }

  buscarPorId(id: number): Observable<Alimento> {
    return this.http.get<Alimento>(`${this.apiUrl}/${id}`);
  }

  criar(alimento: Partial<Alimento>): Observable<Alimento> {
    return this.http.post<Alimento>(this.apiUrl, alimento);
  }

  atualizar(id: number, alimento: Partial<Alimento>): Observable<Alimento> {
    return this.http.put<Alimento>(`${this.apiUrl}/${id}`, alimento);
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
