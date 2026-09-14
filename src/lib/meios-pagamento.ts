export type TipoMeioPagamento = "pix" | "dinheiro" | "transferencia" | "gateway";

export type StatusIntegracao =
  | "manual"
  | "configuracao_pendente"
  | "conectado"
  | "erro"
  | "desativado";

/**
 * Configuração específica do meio de pagamento.
 * Extensível para permitir futuras configurações por provedor
 * sem alterar a estrutura principal.
 */
export interface ConfigMeioPagamento {
  // PIX
  instituicao?: string;
  chavePix?: string;
  tipoChave?: "cpf" | "email" | "telefone" | "aleatoria";
  // Conta bancária
  banco?: string;
  agencia?: string;
  conta?: string;
  // Gateway / API (futuro)
  endpoint?: string;
  webhookUrl?: string;
  // Campos livres para futura expansão
  [chave: string]: string | undefined;
}

export interface MeioPagamento {
  id: string;
  nome: string;
  tipo: TipoMeioPagamento;
  /** Nome do provedor (ex.: "Nubank", "Mercado Pago", "Manual"). */
  provedor: string;
  ativo: boolean;
  statusIntegracao: StatusIntegracao;
  configuracoes: ConfigMeioPagamento;
  criadoEm: string;
  atualizadoEm: string;
}

export const meiosPagamento: MeioPagamento[] = [
  {
    id: "mp1",
    nome: "PIX Principal",
    tipo: "pix",
    provedor: "Nubank",
    ativo: true,
    statusIntegracao: "manual",
    configuracoes: {
      instituicao: "Nubank",
      chavePix: "",
      tipoChave: "cpf",
    },
    criadoEm: "2026-08-01",
    atualizadoEm: "2026-08-01",
  },
  {
    id: "mp2",
    nome: "Dinheiro",
    tipo: "dinheiro",
    provedor: "Manual",
    ativo: true,
    statusIntegracao: "manual",
    configuracoes: {},
    criadoEm: "2026-08-01",
    atualizadoEm: "2026-08-01",
  },
  {
    id: "mp3",
    nome: "Transferência Bancária",
    tipo: "transferencia",
    provedor: "Banco do Brasil",
    ativo: true,
    statusIntegracao: "manual",
    configuracoes: {
      banco: "Banco do Brasil",
      agencia: "1234-5",
      conta: "67890-1",
    },
    criadoEm: "2026-08-01",
    atualizadoEm: "2026-08-01",
  },
];
