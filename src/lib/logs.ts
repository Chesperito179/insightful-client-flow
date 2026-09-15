/**
 * Modelo de Log / Auditoria — transversal ao sistema.
 *
 * Estrutura desenhada para migração futura a banco de dados:
 * campos primitivos, referências por id e detalhes estruturados
 * (nenhuma dependência de componentes de interface).
 */

/** Entidades auditáveis do sistema. */
export type EntidadeLog =
  | "cliente"
  | "pagamento"
  | "renovacao"
  | "revenda"
  | "recarga"
  | "credito"
  | "servidor"
  | "aplicativo"
  | "meio_pagamento"
  | "configuracao"
  | "sistema";

/** Ações auditáveis. */
export type AcaoLog =
  | "criar"
  | "editar"
  | "excluir"
  | "renovar"
  | "renovar_personalizado"
  | "registrar_pagamento"
  | "cancelar_pagamento"
  | "registrar_recarga"
  | "entrada_credito"
  | "saida_credito"
  | "alterar_configuracao"
  | "login"
  | "outro";

/** Origem da ação — permite diferenciar manual, automática e API/webhook. */
export type OrigemLog = "manual" | "automatica" | "api" | "webhook" | "sistema";

/** Nível de severidade, útil para futuros filtros e alertas. */
export type NivelLog = "info" | "alerta" | "critico";

/**
 * Alteração estruturada de um campo.
 * Permite renderizar futuramente frases como
 * "Valor alterado de R$ 30,00 para R$ 35,00".
 */
export interface AlteracaoCampo {
  campo: string;
  /** Rótulo legível do campo (ex.: "Valor cobrado"). */
  rotulo?: string;
  /** Formato do valor, para exibição futura. */
  formato?: "texto" | "numero" | "moeda" | "data" | "booleano";
  de?: string | number | boolean | null;
  para?: string | number | boolean | null;
}

export interface LogAuditoria {
  id: string;
  /** Data/hora em ISO 8601 completo (UTC ou com offset). */
  dataHora: string;
  /** Identificador do usuário responsável (preparado para auth futura). */
  usuarioId?: string;
  /** Nome exibido do usuário responsável. */
  usuarioNome: string;
  acao: AcaoLog;
  entidade: EntidadeLog;
  /** Id do registro afetado dentro da entidade. */
  entidadeId?: string;
  /** Rótulo legível do registro afetado. */
  entidadeRotulo?: string;
  /** Cliente afetado, quando aplicável. */
  clienteId?: string;
  clienteNome?: string;
  /** Resumo textual curto da alteração. */
  descricao: string;
  /** Detalhes estruturados campo a campo. */
  alteracoes?: AlteracaoCampo[];
  origem: OrigemLog;
  nivel?: NivelLog;
  /** Informações adicionais livres (chave/valor serializável). */
  metadados?: Record<string, string | number | boolean | null>;
}

/** Dados necessários para registrar um log; o restante é preenchido pela store. */
export type NovoLog = Omit<LogAuditoria, "id" | "dataHora" | "usuarioNome" | "origem"> &
  Partial<Pick<LogAuditoria, "dataHora" | "usuarioId" | "usuarioNome" | "origem">>;

export const USUARIO_PADRAO_LOG = "Administrador";

export const rotulosAcao: Record<AcaoLog, string> = {
  criar: "Criação",
  editar: "Edição",
  excluir: "Exclusão",
  renovar: "Renovação",
  renovar_personalizado: "Renovação personalizada",
  registrar_pagamento: "Registro de pagamento",
  cancelar_pagamento: "Cancelamento de pagamento",
  registrar_recarga: "Registro de recarga",
  entrada_credito: "Entrada de créditos",
  saida_credito: "Saída de créditos",
  alterar_configuracao: "Alteração de configuração",
  login: "Acesso",
  outro: "Outra ação",
};

export const rotulosEntidade: Record<EntidadeLog, string> = {
  cliente: "Cliente",
  pagamento: "Pagamento",
  renovacao: "Renovação",
  revenda: "Revenda",
  recarga: "Recarga",
  credito: "Crédito",
  servidor: "Servidor",
  aplicativo: "Aplicativo",
  meio_pagamento: "Meio de pagamento",
  configuracao: "Configuração",
  sistema: "Sistema",
};

export const rotulosOrigem: Record<OrigemLog, string> = {
  manual: "Manual",
  automatica: "Automática",
  api: "API",
  webhook: "Webhook",
  sistema: "Sistema",
};

/** Filtros suportados pela consulta de logs (preparado para query em banco). */
export interface FiltroLogs {
  termo?: string;
  dataInicio?: string;
  dataFim?: string;
  usuario?: string;
  acao?: AcaoLog | "todas";
  entidade?: EntidadeLog | "todas";
  clienteId?: string | "todos";
  pagina?: number;
  porPagina?: number;
}

export function filtrarLogs(lista: LogAuditoria[], filtro: FiltroLogs): LogAuditoria[] {
  const termo = filtro.termo?.trim().toLowerCase();
  return lista
    .filter((l) => {
      if (filtro.acao && filtro.acao !== "todas" && l.acao !== filtro.acao) return false;
      if (filtro.entidade && filtro.entidade !== "todas" && l.entidade !== filtro.entidade) return false;
      if (filtro.usuario && filtro.usuario !== "todos" && l.usuarioNome !== filtro.usuario) return false;
      if (filtro.clienteId && filtro.clienteId !== "todos" && l.clienteId !== filtro.clienteId) return false;
      if (filtro.dataInicio && l.dataHora.slice(0, 10) < filtro.dataInicio) return false;
      if (filtro.dataFim && l.dataHora.slice(0, 10) > filtro.dataFim) return false;
      if (termo) {
        const alvo = [
          l.descricao,
          l.usuarioNome,
          l.entidadeRotulo ?? "",
          l.clienteNome ?? "",
          rotulosAcao[l.acao],
          rotulosEntidade[l.entidade],
        ]
          .join(" ")
          .toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      return true;
    })
    .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
}

export const dataHoraBR = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

/** Nenhum registro de exemplo: a base inicia vazia. */
export const logs: LogAuditoria[] = [];
