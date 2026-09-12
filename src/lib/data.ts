/**
 * Camada de dados da Etapa 1.
 *
 * Os dados abaixo são de demonstração e ficam isolados neste módulo de
 * propósito: nas próximas etapas basta trocar estas funções por consultas
 * reais, sem alterar as telas que as consomem.
 */

export type ExpirationStatus = "ativo" | "vencendo" | "vencido";

export interface Servidor {
  id: string;
  nome: string;
  custoCredito: number;
  ativo: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  usuario: string;
  telefone: string;
  valor: number;
  expiracao: string; // ISO yyyy-mm-dd
  ultimoPagamento: string;
  valorUltimoPagamento: number;
  servidorId: string;
  aplicativo: string;
  observacoes: string;
}

export interface Pagamento {
  id: string;
  clienteId: string;
  data: string;
  valor: number;
  status: "pago" | "pendente";
  tipo: "renovação" | "adesão";
}

export const servidores: Servidor[] = [
  { id: "s1", nome: "Servidor 1", custoCredito: 8, ativo: true },
  { id: "s2", nome: "Servidor 2", custoCredito: 10, ativo: true },
  { id: "s3", nome: "Servidor 3", custoCredito: 7.5, ativo: true },
];

export const clientes: Cliente[] = [
  {
    id: "c1",
    nome: "João Silva",
    usuario: "joao123",
    telefone: "(11) 98812-4410",
    valor: 30,
    expiracao: "2026-09-12",
    ultimoPagamento: "2026-08-12",
    valorUltimoPagamento: 30,
    servidorId: "s1",
    aplicativo: "XCLOUD",
    observacoes: "Smart TV Samsung",
  },
  {
    id: "c2",
    nome: "Maria Souza",
    usuario: "maria456",
    telefone: "(21) 99671-2280",
    valor: 35,
    expiracao: "2026-09-14",
    ultimoPagamento: "2026-08-14",
    valorUltimoPagamento: 35,
    servidorId: "s2",
    aplicativo: "KPlay",
    observacoes: "Dois pontos ativos",
  },
  {
    id: "c3",
    nome: "Pedro Santos",
    usuario: "pedro789",
    telefone: "(31) 98120-7745",
    valor: 30,
    expiracao: "2026-09-17",
    ultimoPagamento: "2026-08-17",
    valorUltimoPagamento: 30,
    servidorId: "s1",
    aplicativo: "XCLOUD",
    observacoes: "TV Box Android",
  },
  {
    id: "c4",
    nome: "Ana Lima",
    usuario: "ana.lima",
    telefone: "(41) 99903-1188",
    valor: 40,
    expiracao: "2026-09-19",
    ultimoPagamento: "2026-08-19",
    valorUltimoPagamento: 40,
    servidorId: "s3",
    aplicativo: "IBO Player",
    observacoes: "Plano anual em negociação",
  },
  {
    id: "c5",
    nome: "Carlos Alves",
    usuario: "carlos88",
    telefone: "(85) 98455-0912",
    valor: 30,
    expiracao: "2026-09-08",
    ultimoPagamento: "2026-08-08",
    valorUltimoPagamento: 30,
    servidorId: "s1",
    aplicativo: "XCLOUD",
    observacoes: "Cobrança enviada por WhatsApp",
  },
  {
    id: "c6",
    nome: "Renata Nunes",
    usuario: "renata22",
    telefone: "(51) 99120-3374",
    valor: 35,
    expiracao: "2026-09-06",
    ultimoPagamento: "2026-08-06",
    valorUltimoPagamento: 35,
    servidorId: "s2",
    aplicativo: "KPlay",
    observacoes: "Sem retorno desde o vencimento",
  },
  {
    id: "c7",
    nome: "Bruno Teixeira",
    usuario: "bruno.tx",
    telefone: "(62) 98277-6631",
    valor: 45,
    expiracao: "2026-10-02",
    ultimoPagamento: "2026-09-02",
    valorUltimoPagamento: 45,
    servidorId: "s3",
    aplicativo: "IBO Player",
    observacoes: "Duas telas",
  },
  {
    id: "c8",
    nome: "Fernanda Rocha",
    usuario: "fe.rocha",
    telefone: "(47) 99845-2210",
    valor: 30,
    expiracao: "2026-10-05",
    ultimoPagamento: "2026-09-05",
    valorUltimoPagamento: 30,
    servidorId: "s1",
    aplicativo: "XCLOUD",
    observacoes: "",
  },
];

export const pagamentos: Pagamento[] = [
  { id: "p1", clienteId: "c1", data: "2026-09-10", valor: 30, status: "pago", tipo: "renovação" },
  { id: "p2", clienteId: "c2", data: "2026-09-09", valor: 35, status: "pago", tipo: "renovação" },
  { id: "p3", clienteId: "c3", data: "2026-09-08", valor: 30, status: "pendente", tipo: "renovação" },
  { id: "p4", clienteId: "c4", data: "2026-09-07", valor: 40, status: "pago", tipo: "renovação" },
  { id: "p5", clienteId: "c5", data: "2026-09-05", valor: 30, status: "pendente", tipo: "renovação" },
  { id: "p6", clienteId: "c8", data: "2026-09-05", valor: 30, status: "pago", tipo: "renovação" },
  { id: "p7", clienteId: "c7", data: "2026-09-02", valor: 45, status: "pago", tipo: "renovação" },
];

/** Data de referência do sistema (nas próximas etapas passa a ser "hoje" real). */
export const hoje = new Date("2026-09-12T12:00:00");

export const diasAteExpirar = (expiracao: string, ref: Date = hoje) => {
  const alvo = new Date(`${expiracao}T12:00:00`).getTime();
  return Math.round((alvo - ref.getTime()) / 86_400_000);
};

export const statusExpiracao = (expiracao: string, ref: Date = hoje): ExpirationStatus => {
  const dias = diasAteExpirar(expiracao, ref);
  if (dias < 0) return "vencido";
  if (dias <= 7) return "vencendo";
  return "ativo";
};

export const servidorPadrao: Servidor = { id: "s0", nome: "Sem servidor", custoCredito: 0, ativo: false };

export const servidorDe = (cliente: Cliente, lista: Servidor[] = servidores): Servidor =>
  lista.find((s) => s.id === cliente.servidorId) ?? servidorPadrao;

export const clienteDe = (clienteId: string, lista: Cliente[] = clientes) =>
  lista.find((c) => c.id === clienteId);

export interface ResumoDashboard {
  total: number;
  ativos: number;
  vencidos: number;
  vencemHoje: number;
  vencem7Dias: number;
  recebidoMes: number;
  previstoReceber: number;
  gastosMes: number;
  lucroEstimado: number;
  valorVencidos: number;
  percentualAtivos: number;
}

export const resumoDashboard = (
  listaClientes: Cliente[] = clientes,
  listaPagamentos: Pagamento[] = pagamentos,
  listaServidores: Servidor[] = servidores,
): ResumoDashboard => {
  const total = listaClientes.length;
  const vencidos = listaClientes.filter((c) => statusExpiracao(c.expiracao) === "vencido");
  const vencendo = listaClientes.filter((c) => statusExpiracao(c.expiracao) === "vencendo");
  const vencemHoje = listaClientes.filter((c) => diasAteExpirar(c.expiracao) === 0).length;
  const ativos = total - vencidos.length;

  const mesRef = hoje.getMonth();
  const doMes = listaPagamentos.filter((p) => new Date(`${p.data}T12:00:00`).getMonth() === mesRef);
  const recebidoMes = doMes.filter((p) => p.status === "pago").reduce((s, p) => s + p.valor, 0);
  const previstoReceber =
    doMes.filter((p) => p.status === "pendente").reduce((s, p) => s + p.valor, 0) +
    vencendo.reduce((s, c) => s + c.valor, 0);
  const gastosMes = doMes
    .filter((p) => p.status === "pago")
    .reduce((s, p) => {
      const cliente = clienteDe(p.clienteId, listaClientes);
      return s + (cliente ? servidorDe(cliente, listaServidores).custoCredito : 0);
    }, 0);

  return {
    total,
    ativos,
    vencidos: vencidos.length,
    vencemHoje,
    vencem7Dias: vencendo.length,
    recebidoMes,
    previstoReceber,
    gastosMes,
    lucroEstimado: recebidoMes - gastosMes,
    valorVencidos: vencidos.reduce((s, c) => s + c.valor, 0),
    percentualAtivos: total ? (ativos / total) * 100 : 0,
  };
};

export const proximasRenovacoes = (lista: Cliente[] = clientes) =>
  [...lista].sort((a, b) => diasAteExpirar(a.expiracao) - diasAteExpirar(b.expiracao)).slice(0, 6);

export const ultimosPagamentos = (lista: Pagamento[] = pagamentos) =>
  [...lista].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 6);

/** Soma meses a uma data ISO, mantendo o dia quando possível. */
export const somarMeses = (iso: string, meses: number) => {
  const d = new Date(`${iso}T12:00:00`);
  const dia = d.getDate();
  d.setMonth(d.getMonth() + meses);
  if (d.getDate() < dia) d.setDate(0);
  return d.toISOString().slice(0, 10);
};

export const isoHoje = (ref: Date = hoje) => {
  const d = new Date(ref);
  d.setHours(12, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

/** Calcula meses fracionados entre duas datas ISO — usado para custo de renovação personalizada. */
export const mesesEntre = (de: string, ate: string) => {
  const inicio = new Date(`${de}T12:00:00`);
  const fim = new Date(`${ate}T12:00:00`);
  return (fim.getTime() - inicio.getTime()) / (86_400_000 * 30);
};
