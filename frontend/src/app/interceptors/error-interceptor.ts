import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notifier = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Tratar 401 (não autorizado) e 403 (proibido) de forma similar: limpar sessão e redirecionar
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('usuario_logado');
        notifier.info('Sessão inválida ou expirada. Faça login novamente.');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
