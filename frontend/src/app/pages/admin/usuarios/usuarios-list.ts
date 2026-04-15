import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { UsuarioService } from '../../../services/usuario.service';
import { NotificationService } from '../../../services/notification.service';
import { Usuario, UsuarioTipo } from '../../../models/usuario';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './usuarios-list.html',
  styleUrls: ['./usuarios-list.scss']
})
export class UsuariosListComponent implements OnInit {
  usuarios: Usuario[] = [];
  carregando = true;
  salvando = false;

  filtroTexto = '';
  usuarioEmEdicao: Usuario | null = null;
  modoEdicao = false;
  form!: FormGroup;

  readonly tipos: UsuarioTipo[] = ['ADMIN', 'NUTRICIONISTA', 'PACIENTE'];
  private readonly cpfValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const digits = this.onlyDigits(control.value);
    if (!digits) return null;
    return this.isValidCpf(digits) ? null : { cpfInvalido: true };
  };

  constructor(
    private usuarioService: UsuarioService,
    private notifier: NotificationService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarForm();
    this.carregar();
  }

  inicializarForm(usuario?: Usuario): void {
    const expiracao = usuario?.planoExpiraEm
      ? usuario.planoExpiraEm.toString().slice(0, 16)
      : '';
    this.form = this.fb.group({
      nome: [usuario?.nome ?? '', [Validators.required, Validators.minLength(2)]],
      email: [usuario?.email ?? '', [Validators.required, Validators.email]],
      cpf: [this.formatCpf(usuario?.cpf), [this.cpfValidator]],
      senha: ['', usuario ? [] : [Validators.required, Validators.minLength(6)]],
      tipo: [usuario?.tipo ?? 'PACIENTE', Validators.required],
      planoExpiraEm: [expiracao]
    });
  }

  carregar(): void {
    this.carregando = true;
    this.usuarioService.listar().subscribe({
      next: (lista) => {
        this.usuarios = lista;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.notifier.error('Erro ao carregar usuários');
      }
    });
  }

  get usuariosFiltrados(): Usuario[] {
    if (!this.filtroTexto.trim()) return this.usuarios;
    const termo = this.filtroTexto.toLowerCase();
    return this.usuarios.filter(u =>
      u.nome.toLowerCase().includes(termo) ||
      u.email.toLowerCase().includes(termo) ||
      u.tipo.toLowerCase().includes(termo)
    );
  }

  abrirModalCriar(): void {
    this.modoEdicao = false;
    this.usuarioEmEdicao = null;
    this.inicializarForm();
    this.abrirModal();
  }

  abrirModalEditar(usuario: Usuario): void {
    this.modoEdicao = true;
    this.usuarioEmEdicao = usuario;
    this.inicializarForm(usuario);
    this.abrirModal();
  }

  private abrirModal(): void {
    const modal = document.getElementById('modalUsuario');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
    }
  }

  fecharModal(): void {
    const modal = document.getElementById('modalUsuario');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
    }
    this.form.reset();
    this.usuarioEmEdicao = null;
    this.modoEdicao = false;
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando = true;
    const dados = { ...this.form.value };
    if (!dados.senha) delete dados.senha;
    dados.cpf = this.onlyDigits(dados.cpf);
    if (!dados.cpf) delete dados.cpf;
    if (dados.planoExpiraEm) {
      dados.planoExpiraEm = dados.planoExpiraEm + ':00';
    } else {
      dados.planoExpiraEm = null;
    }

    const operacao = this.modoEdicao && this.usuarioEmEdicao?.id
      ? this.usuarioService.atualizar(this.usuarioEmEdicao.id, dados)
      : this.usuarioService.criar(dados);

    operacao.subscribe({
      next: () => {
        this.salvando = false;
        this.notifier.success(this.modoEdicao ? 'Usuário atualizado!' : 'Usuário criado!');
        this.fecharModal();
        this.carregar();
      },
      error: (err) => {
        this.salvando = false;
        const apiBody = err.error ?? {};
        let msg = this.modoEdicao ? 'Erro ao atualizar' : 'Erro ao criar usuário';

        // Se o backend retornou um mapa de errors, formatar mensagens por campo
        if (apiBody.errors && typeof apiBody.errors === 'object') {
          const campos = Object.keys(apiBody.errors as Record<string, string>);
          msg = campos.map(c => `${c}: ${(apiBody.errors as Record<string, string>)[c]}`).join(' | ');
        } else if (apiBody.message) {
          msg = apiBody.message;
        }

        this.notifier.error(msg);
      }
    });
  }

  alternarAtivo(usuario: Usuario): void {
    if (!usuario.id) return;
    const operacao = usuario.ativo
      ? this.usuarioService.desativar(usuario.id)
      : this.usuarioService.ativar(usuario.id);

    operacao.subscribe({
      next: () => {
        this.notifier.success(usuario.ativo ? 'Usuário desativado' : 'Usuário ativado');
        this.carregar();
      },
      error: () => this.notifier.error('Erro ao alterar status do usuário')
    });
  }

  remover(usuario: Usuario): void {
    if (!usuario.id) return;
    if (!confirm(`Remover o usuário "${usuario.nome}"? Esta ação não pode ser desfeita.`)) return;

    this.usuarioService.remover(usuario.id).subscribe({
      next: () => {
        this.notifier.success('Usuário removido');
        this.carregar();
      },
      error: () => this.notifier.error('Erro ao remover usuário')
    });
  }

  tipoBadgeClass(tipo: UsuarioTipo): string {
    switch (tipo) {
      case 'ADMIN': return 'badge-admin';
      case 'NUTRICIONISTA': return 'badge-nutri';
      default: return 'badge-paciente';
    }
  }

  onCpfInput(): void {
    const control = this.form.get('cpf');
    if (!control) return;
    const formatted = this.formatCpf(control.value);
    if (control.value !== formatted) {
      control.setValue(formatted, { emitEvent: false });
    }
  }

  cpfExibicao(cpf?: string): string {
    return this.formatCpf(cpf) || '—';
  }

  private formatCpf(value?: string | null): string {
    const digits = this.onlyDigits(value).slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  private onlyDigits(value?: string | null): string {
    return (value ?? '').replace(/\D/g, '');
  }

  private isValidCpf(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    const digits = cpf.split('').map(Number);
    const digit1 = this.calculateCpfDigit(digits, 10);
    const digit2 = this.calculateCpfDigit(digits, 11);

    return digit1 === digits[9] && digit2 === digits[10];
  }

  private calculateCpfDigit(digits: number[], factor: number): number {
    const total = digits
      .slice(0, factor - 1)
      .reduce((sum, digit, index) => sum + digit * (factor - index), 0);

    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  }
}
