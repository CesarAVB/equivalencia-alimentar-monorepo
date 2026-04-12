import { Alimento } from './alimento';

export interface Equivalencia {
  id?: string;
  alimentoOrigemId: number;
  alimentoDestinoId: number;
  fatorEquivalencia: number;
  observacao?: string;
  alimentoOrigem?: Alimento;
  alimentoDestino?: Alimento;
}

/** Resultado enriquecido para exibição na home */
export interface EquivalenciaDetalhada extends Equivalencia {
  nomeDestino: string;
  grupoDestino: string;
  kcalDestino: number;
  // Campos opcionais trazidos pela API de cálculo
  quantidadeGramas?: number;
  quantidadeDestinoGramas?: number;
  alimentoOrigemDescricao?: string;
  alimentoDestinoDescricao?: string;
}

/** Resposta de cálculo de equivalências (usada pela tela quando passa quantidade) */
export interface EquivalenciaCalculada {
  alimentoOrigemDescricao: string;
  quantidadeGramas?: number;
  alimentoDestinoDescricao: string;
  quantidadeDestinoGramas: number;
  fatorEquivalencia: number;
}
