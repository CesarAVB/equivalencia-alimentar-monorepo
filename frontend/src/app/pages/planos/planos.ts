import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PagamentoService } from '../../services/pagamento.service';
import { NotificationService } from '../../services/notification.service';
import { PlanoTipo } from '../../models/usuario';

interface Plano {
  id: PlanoTipo;
  nome: string;
  preco: string;
  periodo: string;
  descricao: string;
  recursos: string[];
  destaque: boolean;
  cor: string;
}

@Component({
  selector: 'app-planos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './planos.html',
  styleUrls: ['./planos.scss']
})
export class PlanosComponent implements OnInit {
  planoAtual: PlanoTipo = 'trial';
  carregandoCheckout = false;
  carregandoPortal = false;

  readonly planos: Plano[] = [
    {
      id: 'trial',
      nome: 'Trial',
      preco: 'Gratuito',
      periodo: 'por 30 dias',
      descricao: 'Acesso inicial para avaliar a plataforma sem cartao.',
      recursos: [
        'Acesso completo aos recursos por 30 dias',
        'Sem necessidade de cartao',
        'Consulta de equivalencias e catalogo completo',
        'Porcoes ajustadas automaticamente'
      ],
      destaque: false,
      cor: 'plano-demo'
    },
    {
      id: 'padrao',
      nome: 'Padrao',
      preco: 'R$ 2,00',
      periodo: 'por mes',
      descricao: 'Assinatura mensal do plano unico disponivel no backend.',
      recursos: [
        'Tudo do trial',
        'Historico completo',
        'Suporte por e-mail',
        'Acesso a atualizacoes'
      ],
      destaque: true,
      cor: 'plano-basic'
    }
  ];

  constructor(
    private auth: AuthService,
    private pagamento: PagamentoService,
    private notifier: NotificationService
  ) {}

  ngOnInit(): void {
    this.planoAtual = this.auth.planoAtual;
  }

  isPlanoAtual(planoId: PlanoTipo): boolean {
    return this.planoAtual === planoId;
  }

  assinar(planoId: PlanoTipo): void {
    if (planoId !== 'padrao') return;
    this.carregandoCheckout = true;

    this.pagamento.iniciarCheckout().subscribe({
      next: (res) => {
        const url = res?.checkoutUrl ?? res?.url;
        if (url) {
          window.location.href = url;
        } else {
          this.carregandoCheckout = false;
          this.notifier.error('Resposta invalida do servidor ao iniciar checkout.');
        }
      },
      error: (err) => {
        this.carregandoCheckout = false;
        const msg = err.error?.message ?? 'Erro ao iniciar checkout. Tente novamente.';
        this.notifier.error(msg);
      }
    });
  }

  gerenciarAssinatura(): void {
    this.carregandoPortal = true;
    this.pagamento.abrirPortal().subscribe({
      next: (res) => {
        const url = res?.portalUrl ?? res?.url;
        if (url) {
          window.location.href = url;
        } else {
          this.carregandoPortal = false;
          this.notifier.error('Resposta invalida do servidor ao abrir portal de assinatura.');
        }
      },
      error: (err) => {
        this.carregandoPortal = false;
        const msg = err.error?.message ?? 'Erro ao abrir portal de assinatura.';
        this.notifier.error(msg);
      }
    });
  }
}
