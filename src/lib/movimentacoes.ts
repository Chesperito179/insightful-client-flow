export type TipoMovimentacao =
  | "entrada"
  | "saida_renovacao"
  | "saida_recarga";

export interface MovimentacaoCredito {
  id: string;
  servidorId: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  data: string;
  /** Referência ao pagamento que originou a movimentação (renovação). */
  pagamentoId?: string;
  /** Referência à recarga de revenda que originou a movimentação. */
  recargaId?: string;
  clienteId?: string;
  revendaId?: string;
  observacoes: string;
}

export const movimentacoes: MovimentacaoCredito[] = [];
