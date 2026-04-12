import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';

function parseJwtPayload(token: string): any | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const json = decodeURIComponent(Array.prototype.map.call(atob(padded), (c: string) => '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notifier = inject(NotificationService);

  const token = localStorage.getItem('auth_token');
  if (token && !req.url.includes('/auth/login')) {
    const payload = parseJwtPayload(token);
    const now = Math.floor(Date.now() / 1000);

    if (!payload || (payload.exp && payload.exp <= now)) {
      // Token inválido ou expirado: limpar sessão e redirecionar ao login.
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('usuario_logado');
      notifier.info('Sessão expirada. Faça login novamente.');
      router.navigate(['/login']);
      // Não anexar Authorization header
      return next(req);
    }

    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req);
};
