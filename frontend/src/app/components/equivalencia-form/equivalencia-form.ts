import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlimentoService } from '../../services/alimento.service';
import { NotificationService } from '../../services/notification.service';
import { Alimento } from '../../models/alimento';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EquivalenciaDetalhada, EquivalenciaCalculada } from '../../models/equivalencia-response';

export interface ResultadoEquivalencias {
  alimentoOrigem: Alimento;
  equivalencias: EquivalenciaDetalhada[];
  quantidadeGramasUsada?: number;
}

@Component({
  selector: 'app-equivalencia-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './equivalencia-form.html',
  styleUrls: ['./equivalencia-form.scss']
})
export class EquivalenciaFormComponent implements OnInit {

  @Output() resultado = new EventEmitter<ResultadoEquivalencias | null>();

  form!: FormGroup;
  carregando = false;
  carregandoAlimentos = false;

  grupos: string[] = [];
  catalogFoods: Record<string, Array<{ text: string; quantity: number }>> = {};
  alimentos: Alimento[] = [];
  todosAlimentos: Alimento[] = [];
  private tempIdCounter = -1;

  constructor(
    private fb: FormBuilder,
    private alimentoService: AlimentoService,
    private notifier: NotificationService
  ) {}

  ngOnInit(): void {
    this.inicializarForm();
    this.carregarCatalogo();
  }

  inicializarForm(): void {
    this.form = this.fb.group({
      grupo: ['', [Validators.required]],
      alimentoId: ['', [Validators.required]],
      quantidadeGramas: [100]
    });

    this.form.get('grupo')?.valueChanges.subscribe((grupo) => {
      this.form.get('alimentoId')?.reset();
      // primeiro tentar popular com o catálogo leve (texto/quantidade)
      const catalogList = this.catalogFoods[grupo] ?? [];
      // gerar ids temporários únicos para evitar chaves duplicadas no template
      let counter = this.tempIdCounter;
      this.alimentos = catalogList.map(c => {
        const item = { id: counter, descricao: c.text, grupo, energiaKcal: 0 } as unknown as Alimento;
        counter--;
        return item;
      });
      this.tempIdCounter = counter;

      // depois buscar os alimentos com IDs (size=100) conforme requisito
      if (grupo) {
        this.carregandoAlimentos = true;
        this.alimentoService.listarPorGrupo(grupo, 100).pipe(
          catchError((err) => {
            this.carregandoAlimentos = false;
            if (!this.alimentos || this.alimentos.length === 0) {
              this.exibirMensagem('Erro ao carregar alimentos do grupo', 'error');
            } else {
              console.warn('Erro ao carregar alimentos do grupo, mantendo catálogo local', err);
            }
            return of({ content: [], totalElements: 0, totalPages: 0, size: 0, number: 0, first: true, last: true });
          })
        ).subscribe({
          next: (page: any) => {
            this.todosAlimentos = page.content;
            this.alimentos = page.content;
            this.carregandoAlimentos = false;
          }
        });
      }
    });

    // não buscar automaticamente ao selecionar alimento; usuário deve clicar em "Buscar"
    this.form.get('alimentoId')?.valueChanges.subscribe(() => {
      this.resultado.emit(null);
    });
  }

  carregarCatalogo(): void {
    this.carregandoAlimentos = true;
    this.alimentoService.catalogo().subscribe({
      next: (resp) => {
        this.grupos = resp.groups ?? [];
        this.catalogFoods = resp.foods ?? {};
        this.carregandoAlimentos = false;
      },
      error: () => {
        this.carregandoAlimentos = false;
        this.exibirMensagem('Erro ao carregar catálogo de alimentos', 'error');
      }
    });
  }

  buscarEquivalencias(alimentoId: number, quantidadeGramas?: number): void {
    this.carregando = true;

    this.alimentoService.obterEquivalencias(alimentoId, quantidadeGramas).subscribe({
      next: (resp: any) => {
        this.carregando = false;
        // responder tanto quando o backend retorna apenas o array, quanto quando retorna o objeto com campo `equivalencias`
        const equivalenciasArray: EquivalenciaCalculada[] = Array.isArray(resp) ? resp : (resp?.equivalencias ?? []);

        const alimentoOrigem = this.todosAlimentos.find(a => a.id === alimentoId);
        if (!alimentoOrigem) return;

        const quantidadeUsada = quantidadeGramas ?? (Array.isArray(resp) ? equivalenciasArray.find(e => (e as any).quantidadeGramas != null)?.quantidadeGramas : resp?.quantidadeGramas) ?? 100;

        const detalhadas: EquivalenciaDetalhada[] = equivalenciasArray.map((eq: EquivalenciaCalculada & any) => {
          // tentar localizar alimento destino pelo nome para obter grupo e kcal, caso exista no catálogo local
          const destino = this.todosAlimentos.find(a => a.descricao === (eq.alimentoDestinoDescricao ?? eq.alimentoDescricao ?? eq.alimentoDestino));
          return {
            alimentoOrigemId: alimentoOrigem.id,
            alimentoDestinoId: destino?.id ?? -1,
            fatorEquivalencia: eq.fatorEquivalencia ?? eq.quantidadeEquivalente ?? 0,
            observacao: undefined,
            alimentoOrigem: alimentoOrigem,
            alimentoDestino: destino,
            nomeDestino: eq.alimentoDestinoDescricao ?? eq.alimentoDescricao,
            grupoDestino: destino?.grupo ?? '-',
            kcalDestino: destino?.energiaKcal ?? 0,
            quantidadeGramas: quantidadeUsada,
            quantidadeDestinoGramas: eq.quantidadeDestinoGramas ?? eq.quantidadeEquivalente,
            alimentoOrigemDescricao: eq.alimentoOrigemDescricao ?? resp?.alimentoOrigemDescricao,
            alimentoDestinoDescricao: eq.alimentoDestinoDescricao ?? eq.alimentoDescricao
          };
        });

        this.resultado.emit({ alimentoOrigem, equivalencias: detalhadas, quantidadeGramasUsada: quantidadeUsada });

        if (detalhadas.length === 0) {
          this.exibirMensagem('Nenhuma equivalência encontrada para este alimento.', 'info');
        } else {
          this.exibirMensagem(`${detalhadas.length} equivalência(s) encontrada(s).`, 'success');
        }
      },
      error: () => {
        this.carregando = false;
        this.exibirMensagem('Erro ao buscar equivalências.', 'error');
      }
    });
  }

  calcular(): void {
    const id = Number(this.form.get('alimentoId')?.value);
    if (!id && id !== 0) {
      this.exibirMensagem('Selecione um alimento antes de buscar.', 'error');
      return;
    }
    // se o id for temporário (negativo), tentar resolver para um alimento real
    if (id <= 0) {
      const placeholder = this.alimentos.find(a => a.id === id);
      const resolved = placeholder ? this.todosAlimentos.find(a => a.descricao === placeholder.descricao) : undefined;
      if (resolved && resolved.id) {
        this.buscarEquivalencias(resolved.id, Number(this.form.get('quantidadeGramas')?.value) || undefined);
        return;
      }
      this.exibirMensagem('Alimento selecionado ainda não possui ID válido — aguarde o carregamento dos alimentos ou escolha outro.', 'error');
      return;
    }
    const q = this.form.get('quantidadeGramas')?.value;
    const quantidade = q ? Number(q) : undefined;
    this.buscarEquivalencias(id, quantidade);
  }

  limpar(): void {
    this.form.reset();
    this.alimentos = [];
    this.resultado.emit(null);
  }

  exibirMensagem(msg: string, tipo: 'success' | 'error' | 'info'): void {
    if (tipo === 'success') {
      this.notifier.success(msg);
      return;
    }
    if (tipo === 'error') {
      this.notifier.error(msg);
      return;
    }
    this.notifier.info(msg);
  }
}
