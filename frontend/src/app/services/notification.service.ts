import { Injectable } from '@angular/core';

type ToastType = 'success' | 'info' | 'error' | 'warning';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private containerId = 'app-toasts';
  private duration = 4200;
  private maxToasts = 4;

  private getContainer(): HTMLElement {
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      container.className = 'app-toasts';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }
    return container;
  }

  private getTitle(type: ToastType): string {
    switch (type) {
      case 'success': return 'Sucesso';
      case 'error': return 'Erro';
      case 'warning': return 'Atenção';
      default: return 'Informação';
    }
  }

  private getIcon(type: ToastType): string {
    switch (type) {
      case 'success': return 'fa-circle-check';
      case 'error': return 'fa-circle-exclamation';
      case 'warning': return 'fa-triangle-exclamation';
      default: return 'fa-circle-info';
    }
  }

  private createToast(message: string, type: ToastType): void {
    const container = this.getContainer();
    const toast = document.createElement('div');
    toast.className = `app-toast app-toast--${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <div class="app-toast__icon">
        <i class="fas ${this.getIcon(type)}" aria-hidden="true"></i>
      </div>
      <div class="app-toast__body">
        <strong class="app-toast__title">${this.getTitle(type)}</strong>
        <span class="app-toast__message">${message}</span>
      </div>
      <button class="app-toast__close" type="button" aria-label="Fechar notificação">
        <i class="fas fa-xmark" aria-hidden="true"></i>
      </button>
      <div class="app-toast__progress"></div>
    `;

    while (container.children.length >= this.maxToasts) {
      container.firstElementChild?.remove();
    }

    container.appendChild(toast);

    const closeButton = toast.querySelector('.app-toast__close') as HTMLButtonElement | null;
    const close = () => {
      toast.classList.remove('show');
      window.setTimeout(() => toast.remove(), 260);
    };

    closeButton?.addEventListener('click', close);

    let timeoutId = window.setTimeout(close, this.duration);
    toast.addEventListener('mouseenter', () => {
      window.clearTimeout(timeoutId);
    });
    toast.addEventListener('mouseleave', () => {
      timeoutId = window.setTimeout(close, 1600);
    });

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
  }

  success(message: string): void {
    this.createToast(message, 'success');
  }

  info(message: string): void {
    this.createToast(message, 'info');
  }

  warning(message: string): void {
    this.createToast(message, 'warning');
  }

  error(message: string): void {
    this.createToast(message, 'error');
  }
}
