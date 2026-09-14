export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  observacao: string;
}

export const despesas: Despesa[] = [];
