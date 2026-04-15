import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { UsuarioSessao } from '../../models/usuario';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  private readonly auth = inject(AuthService);

  usuario$: Observable<UsuarioSessao | null> = this.auth.usuario$;
  menuOpen = false;

  get isAdmin(): boolean {
    return this.auth.isAdmin;
  }

  get isAdminOrNutricionista(): boolean {
    return this.auth.isAdminOrNutricionista;
  }

  iniciais(nome: string): string {
    return nome
      .split(' ')
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
  }

  diasRestantes(usuario: UsuarioSessao | null): number | null {
    if (!usuario) return null;
    if ((usuario.plano ?? '').toLowerCase() !== 'trial') return null;
    if (!usuario.planoExpiraEm) return null;
    const exp = new Date(usuario.planoExpiraEm);
    const diff = Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return isNaN(diff) ? null : diff;
  }

  isTrialExpired(usuario: UsuarioSessao | null): boolean {
    return this.auth.isTrialExpired(usuario);
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (typeof window !== 'undefined' && window.innerWidth > 1100 && this.menuOpen) {
      this.menuOpen = false;
    }
  }

  logout(): void {
    this.closeMenu();
    this.auth.logout();
  }
}
