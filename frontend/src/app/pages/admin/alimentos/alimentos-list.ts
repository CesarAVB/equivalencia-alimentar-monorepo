import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlimentoService } from '../../../services/alimento.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { Alimento, GrupoAlimentar, GRUPOS_ALIMENTARES } from '../../../models/alimento';

@Component({
  selector: 'app-alimentos-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './alimentos-list.html',
  styleUrls: ['./alimentos-list.scss']
})
export class AlimentosListComponent implements OnInit {
  alimentos: Alimento[] = [];
  totalElements = 0;
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  carregando = true;
  salvando = false;

  filtroTexto = '';
  filtroGrupo = '';
  alimentoEmEdicao: Alimento | null = null;
  modoEdicao = false;
  form!: FormGroup;

  readonly grupos = GRUPOS_ALIMENTARES;

  get isAdmin(): boolean {
    return this.auth.isAdmin;
  }

  constructor(
    private alimentoService: AlimentoService,
    private notifier: NotificationService,
    private auth: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarForm();
    this.carregar();
  }

  inicializarForm(alimento?: Alimento): void {
    this.form = this.fb.group({
      codigoSubstituicao: [alimento?.codigoSubstituicao ?? '', Validators.required],
      grupo: [alimento?.grupo ?? '', Validators.required],
      descricao: [alimento?.descricao ?? '', [Validators.required, Validators.minLength(2)]],
      energiaKcal: [alimento?.energiaKcal ?? '', [Validators.required, Validators.min(0)]]
    });
  }

  carregar(): void {
    this.carregando = true;
    this.alimentoService.listar(this.currentPage, this.pageSize, this.filtroTexto || undefined, this.filtroGrupo || undefined).subscribe({
      next: (page) => {
        this.alimentos = page.content;
        this.totalElements = page.totalElements;
        this.totalPages = page.totalPages;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.notifier.error('Erro ao carregar alimentos');
      }
    });
  }

  buscar(): void {
    this.currentPage = 0;
    this.carregar();
  }

  irParaPagina(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.carregar();
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  get paginationItems(): Array<number | 'ellipsis'> {
    if (this.totalPages <= 7) {
      return this.paginas;
    }

    const pages = new Set<number>([
      0,
      1,
      this.totalPages - 2,
      this.totalPages - 1,
      this.currentPage - 1,
      this.currentPage,
      this.currentPage + 1
    ]);

    const validPages = Array.from(pages)
      .filter((page) => page >= 0 && page < this.totalPages)
      .sort((a, b) => a - b);

    const items: Array<number | 'ellipsis'> = [];

    validPages.forEach((page, index) => {
      const previousPage = validPages[index - 1];

      if (index > 0 && previousPage !== undefined && page - previousPage > 1) {
        items.push('ellipsis');
      }

      items.push(page);
    });

    return items;
  }

  get paginaInicialItem(): number {
    if (this.totalElements === 0) return 0;
    return this.currentPage * this.pageSize + 1;
  }

  get paginaFinalItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  abrirModalCriar(): void {
    this.modoEdicao = false;
    this.alimentoEmEdicao = null;
    this.inicializarForm();
    this.abrirModal();
  }

  abrirModalEditar(alimento: Alimento): void {
    this.modoEdicao = true;
    this.alimentoEmEdicao = alimento;
    this.inicializarForm(alimento);
    this.abrirModal();
  }

  private abrirModal(): void {
    const modal = document.getElementById('modalAlimento');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
    }
  }

  fecharModal(): void {
    const modal = document.getElementById('modalAlimento');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
    }
    this.form.reset();
    this.alimentoEmEdicao = null;
    this.modoEdicao = false;
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando = true;
    const dados = this.form.value;

    const operacao = this.modoEdicao && this.alimentoEmEdicao?.id
      ? this.alimentoService.atualizar(this.alimentoEmEdicao.id, dados)
      : this.alimentoService.criar(dados);

    operacao.subscribe({
      next: () => {
        this.salvando = false;
        this.notifier.success(this.modoEdicao ? 'Alimento atualizado!' : 'Alimento criado!');
        this.fecharModal();
        this.carregar();
      },
      error: (err) => {
        this.salvando = false;
        const msg = err.error?.message ?? 'Erro ao salvar alimento';
        this.notifier.error(msg);
      }
    });
  }

  remover(alimento: Alimento): void {
    if (!confirm(`Remover "${alimento.descricao}"? Esta acao nao pode ser desfeita.`)) return;

    this.alimentoService.remover(alimento.id).subscribe({
      next: () => {
        this.notifier.success('Alimento removido');
        this.carregar();
      },
      error: () => this.notifier.error('Erro ao remover alimento')
    });
  }

  readonly Math = Math;

  grupoBadgeClass(grupo: GrupoAlimentar): string {
    const mapa: Record<string, string> = {
      'Frutas': 'badge-frutas',
      'Carboidratos': 'badge-carbo',
      'Prote\u00edna': 'badge-prot',
      'Latic\u00edneos': 'badge-latic',
      'Gordura Vegetal': 'badge-gord'
    };
    return mapa[grupo] ?? 'badge-secondary';
  }
}
