import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { AuthResponse } from '../models/auth-response';
import { PlanoTipo, UsuarioSessao } from '../models/usuario';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly STORAGE_KEY = 'usuario_logado';
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private tokenExpiryTimeoutId: number | null = null;

  private usuarioSubject = new BehaviorSubject<UsuarioSessao | null>(this.carregarDoStorage());
  usuario$ = this.usuarioSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private notifier: NotificationService
  ) {
    this.inicializarControleDeExpiracao();
  }

  get usuarioAtual(): UsuarioSessao | null {
    return this.usuarioSubject.value;
  }

  get estaLogado(): boolean {
    const token = this.token;
    if (!token) return false;
    const expEmMs = this.obterExpiracaoTokenEmMs(token);
    return !!expEmMs && expEmMs > Date.now();
  }

  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  get isAdmin(): boolean {
    return this.usuarioAtual?.tipo === 'ADMIN';
  }

  get isAdminOrNutricionista(): boolean {
    const tipo = this.usuarioAtual?.tipo;
    return tipo === 'ADMIN' || tipo === 'NUTRICIONISTA';
  }

  fazerLogin(email: string, senha: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, senha }).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        const sessao: UsuarioSessao = {
          nome: res.nome,
          email: res.email,
          tipo: res.perfil,
          plano: res.plano,
          planoExpiraEm: res.planoExpiraEm
        };
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessao));
        this.usuarioSubject.next(sessao);
        this.agendarLogoutPorExpiracao(res.token);
        this.router.navigate(['/home']);
        this.notifier.success('Login realizado com sucesso');
      })
    );
  }

  get planoAtual(): PlanoTipo {
    return this.usuarioAtual?.plano ?? 'trial';
  }

  /** Retorna true se o trial ja expirou (verificacao local sem chamar backend) */
  isTrialExpired(usuario?: UsuarioSessao | null): boolean {
    const u = usuario ?? this.usuarioAtual;
    if (!u) return false;
    if ((u.plano ?? '').toLowerCase() !== 'trial') return false;
    if (!u.planoExpiraEm) return true;
    try {
      const exp = new Date(u.planoExpiraEm);
      return Date.now() > exp.getTime();
    } catch {
      return true;
    }
  }

  /** Retorna true se o usuario tem acesso premium ativo (padrao ou trial nao expirado) */
  hasPremiumAccess(usuario?: UsuarioSessao | null): boolean {
    const u = usuario ?? this.usuarioAtual;
    if (!u) return false;
    const plano = (u.plano ?? '').toLowerCase();
    if (plano === 'padrao') return true;
    if (plano === 'trial') return !this.isTrialExpired(u);
    return false;
  }

  atualizarPlanoNaSessao(plano: PlanoTipo, planoExpiraEm?: string): void {
    const atual = this.usuarioSubject.value;
    if (!atual) return;
    const atualizado: UsuarioSessao = { ...atual, plano, planoExpiraEm };
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(atualizado));
    this.usuarioSubject.next(atualizado);
  }

  logout(): void {
    this.limparSessaoLocal();
    this.router.navigate(['/login']);
    this.notifier.info('Voce saiu da sessao');
  }

  logoutPorExpiracao(mensagem = 'Sessao expirada. Faca login novamente.'): void {
    this.limparSessaoLocal();
    this.router.navigate(['/login']);
    this.notifier.info(mensagem);
  }

  private inicializarControleDeExpiracao(): void {
    const token = this.token;
    if (!token) return;

    const expEmMs = this.obterExpiracaoTokenEmMs(token);
    if (!expEmMs || expEmMs <= Date.now()) {
      this.logoutPorExpiracao();
      return;
    }

    this.agendarLogoutPorExpiracao(token);
  }

  private limparSessaoLocal(): void {
    if (this.tokenExpiryTimeoutId !== null) {
      clearTimeout(this.tokenExpiryTimeoutId);
      this.tokenExpiryTimeoutId = null;
    }

    localStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.STORAGE_KEY);
    this.usuarioSubject.next(null);
  }

  private agendarLogoutPorExpiracao(token: string): void {
    const expEmMs = this.obterExpiracaoTokenEmMs(token);
    if (!expEmMs) {
      this.logoutPorExpiracao();
      return;
    }

    const atrasoEmMs = expEmMs - Date.now();
    if (atrasoEmMs <= 0) {
      this.logoutPorExpiracao();
      return;
    }

    if (this.tokenExpiryTimeoutId !== null) {
      clearTimeout(this.tokenExpiryTimeoutId);
    }

    this.tokenExpiryTimeoutId = globalThis.setTimeout(() => {
      this.logoutPorExpiracao();
    }, atrasoEmMs);
  }

  private obterExpiracaoTokenEmMs(token: string): number | null {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return null;

      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      const json = decodeURIComponent(
        Array.prototype.map
          .call(atob(padded), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(json);
      const exp = Number(payload?.exp);
      if (!Number.isFinite(exp) || exp <= 0) return null;
      return exp * 1000;
    } catch {
      return null;
    }
  }

  private carregarDoStorage(): UsuarioSessao | null {
    try {
      const salvo = sessionStorage.getItem(this.STORAGE_KEY);
      return salvo ? JSON.parse(salvo) : null;
    } catch {
      return null;
    }
  }
}
