import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const premiumGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaLogado && auth.hasPremiumAccess()) {
    return true;
  }

  // Usuário não tem acesso premium -> redireciona para página de planos/checkout
  return router.createUrlTree(['/planos']);
};
