export interface Revenda {
  id: string;
  nome: string;
  usuario: string;
  painel: string;
  /** Valor de compra do crédito (R$). */
  valorCredito: number;
  /** Data ISO da última recarga; vazio quando ainda não houve recarga. */
  ultimaRecarga: string;
  observacoes: string;
}

/** Registro de recarga. A regra financeira será definida em etapa posterior. */
export interface RecargaRevenda {
  id: string;
  revendaId: string;
  data: string;
  quantidade: number;
  valorCredito: number;
  observacoes: string;
}

export const revendas: Revenda[] = [
  {
    id: "r1",
    nome: "Cristina Lopes",
    usuario: "cristina.rev",
    painel: "Painel Alpha",
    valorCredito: 7.5,
    ultimaRecarga: "2026-09-02",
    observacoes: "Recarrega sempre no início do mês.",
  },
  {
    id: "r2",
    nome: "Diego Antunes",
    usuario: "diego.rev",
    painel: "Painel Nova",
    valorCredito: 8,
    ultimaRecarga: "2026-08-27",
    observacoes: "",
  },
];

export const recargas: RecargaRevenda[] = [];
