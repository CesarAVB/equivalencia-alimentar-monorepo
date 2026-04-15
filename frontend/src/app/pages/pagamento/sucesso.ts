import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-pagamento-sucesso',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sucesso.html',
  styleUrls: ['./retorno.scss']
})
export class PagamentoSucessoComponent implements OnInit {
  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    const atual = this.auth.usuarioAtual;
    if (atual) {
      this.auth.atualizarPlanoNaSessao('padrao');
    }
  }
}
