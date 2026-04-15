import { Component, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquivalenciaDetalhada } from '../../models/equivalencia-response';
import { Alimento } from '../../models/alimento';
import { ResultadoEquivalencias } from '../equivalencia-form/equivalencia-form';

@Component({
  selector: 'app-resultado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resultado.html',
  styleUrls: ['./resultado.scss']
})
export class ResultadoComponent {

  @Input() dados: ResultadoEquivalencias | null = null;
  sortField: 'nomeDestino' = 'nomeDestino';
  sortAsc = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dados'] && this.dados) {
      this.sortField = 'nomeDestino';
      this.sortAsc = true;
    }
  }

  obterEquivalencias(): EquivalenciaDetalhada[] {
    if (!this.dados) return [];
    const lista = [...this.dados.equivalencias];
    lista.sort((a, b) => a.nomeDestino.localeCompare(b.nomeDestino, 'pt', { sensitivity: 'base' }) * (this.sortAsc ? 1 : -1));
    return lista;
  }
  toggleSort(field: 'nomeDestino') {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
  }

  get alimentoOrigem(): Alimento | null {
    return this.dados?.alimentoOrigem ?? null;
  }

  get quantidadeUsada(): number | null {
    if (!this.dados) return null;
    return this.dados.quantidadeGramasUsada ?? this.dados.equivalencias[0]?.quantidadeGramas ?? null;
  }

  get energiaCalculada(): number | null {
    if (!this.alimentoOrigem || this.quantidadeUsada == null) return null;
    return (this.quantidadeUsada / 100) * this.alimentoOrigem.energiaKcal;
  }

  formatQuantidade(eq: EquivalenciaDetalhada): string {
    const destino = eq.quantidadeDestinoGramas ?? (eq.quantidadeGramas ? (eq.quantidadeGramas * (eq.fatorEquivalencia ?? 1)) : undefined);
    if (destino == null || isNaN(destino)) return '—';
    // Mostrar sem casas decimais (gramas inteiros)
    return `${Math.round(destino)} g`;
  }

  exportarCSV(): void {
    if (!this.dados) return;
    const origem = this.dados.alimentoOrigem;
    let csv = `Alimento de Origem;Grupo;Energia (kcal)\n`;
    csv += `${origem.descricao};${origem.grupo};${origem.energiaKcal}\n\n`;
    csv += `Equivalências\n`;
    csv += `Substituto;Grupo;Quantidade (g)\n`;
    this.obterEquivalencias().forEach(eq => {
      csv += `${eq.nomeDestino};${eq.grupoDestino};${this.formatQuantidade(eq)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equivalencias_${origem.descricao.replace(/\s+/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
