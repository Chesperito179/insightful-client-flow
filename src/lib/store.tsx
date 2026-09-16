import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  clientes as clientesSeed,
  isoHoje,
  mesesEntre,
  pagamentos as pagamentosSeed,
  servidores as servidoresSeed,
  somarMeses,
  type Cliente,
  type Pagamento,
  type Servidor,
} from "@/lib/data";
import {
  recargas as recargasSeed,
  revendas as revendasSeed,
  type RecargaRevenda,
  type Revenda,
} from "@/lib/revendas";
import {
  movimentacoes as movimentacoesSeed,
  type MovimentacaoCredito,
  type TipoMovimentacao,
} from "@/lib/movimentacoes";
import {
  despesas as despesasSeed,
  type Despesa,
} from "@/lib/despesas";
import {
  meiosPagamento as meiosPagamentoSeed,
  type MeioPagamento,
} from "@/lib/meios-pagamento";
import {
  logs as logsSeed,
  USUARIO_PADRAO_LOG,
  type AlteracaoCampo,
  type LogAuditoria,
  type NovoLog,
} from "@/lib/logs";

const STORAGE_KEY = "meridian.dados.v1";

interface Estado {
  clientes: Cliente[];
  servidores: Servidor[];
  pagamentos: Pagamento[];
  revendas: Revenda[];
  recargas: RecargaRevenda[];
  movimentacoes: MovimentacaoCredito[];
  despesas: Despesa[];
  meiosPagamento: MeioPagamento[];
  logs: LogAuditoria[];
}

const estadoInicial: Estado = {
  clientes: clientesSeed,
  servidores: servidoresSeed,
  pagamentos: pagamentosSeed,
  revendas: revendasSeed,
  recargas: recargasSeed,
  movimentacoes: movimentacoesSeed,
  despesas: despesasSeed,
  meiosPagamento: meiosPagamentoSeed,
  logs: logsSeed,
};

export type NovoCliente = Omit<Cliente, "id" | "ultimoPagamento" | "valorUltimoPagamento"> &
  Partial<Pick<Cliente, "ultimoPagamento" | "valorUltimoPagamento">>;

interface ContextoDados extends Estado {
  usuarioExiste: (usuario: string, ignorarId?: string) => boolean;
  criarCliente: (dados: NovoCliente) => { ok: boolean; erro?: string };
  atualizarCliente: (id: string, dados: NovoCliente) => { ok: boolean; erro?: string };
  removerCliente: (id: string) => void;
  renovarCliente: (id: string, meses: number, valor: number, novaData?: string, meioPagamentoId?: string) => { ok: boolean; erro?: string };
  pagamentosDoCliente: (clienteId: string) => Pagamento[];
  restaurarDemo: () => void;
  // Revendas
  revendaUsuarioExiste: (usuario: string, ignorarId?: string) => boolean;
  criarRevenda: (dados: NovaRevenda) => { ok: boolean; erro?: string };
  atualizarRevenda: (id: string, dados: NovaRevenda) => { ok: boolean; erro?: string };
  removerRevenda: (id: string) => void;
  registrarRecarga: (dados: NovaRecarga) => { ok: boolean; erro?: string };
  recargasDaRevenda: (revendaId: string) => RecargaRevenda[];
  // Créditos
  saldoServidor: (servidorId: string) => number;
  registrarEntradaCreditos: (servidorId: string, quantidade: number, observacoes?: string) => { ok: boolean; erro?: string };
  movimentacoesDoServidor: (servidorId: string) => MovimentacaoCredito[];
  // Despesas
  criarDespesa: (dados: NovaDespesa) => { ok: boolean; erro?: string };
  removerDespesa: (id: string) => void;
  // Meios de pagamento
  criarMeioPagamento: (dados: NovoMeioPagamento) => { ok: boolean; erro?: string };
  atualizarMeioPagamento: (id: string, dados: NovoMeioPagamento) => { ok: boolean; erro?: string };
  removerMeioPagamento: (id: string) => { ok: boolean; erro?: string };
  toggleMeioPagamento: (id: string) => void;
  meiosPagamentoAtivos: () => MeioPagamento[];
  nomeMeioPagamento: (id?: string) => string;
  // Logs / auditoria
  registrarLog: (dados: NovoLog) => LogAuditoria;
  logsDoCliente: (clienteId: string) => LogAuditoria[];
  usuariosDosLogs: () => string[];
}

export type NovaRevenda = Omit<Revenda, "id" | "ultimaRecarga"> & Partial<Pick<Revenda, "ultimaRecarga">>;
export type NovaRecarga = Omit<RecargaRevenda, "id" | "custoCredito" | "custoTotal" | "lucro">;
export type NovaDespesa = Omit<Despesa, "id">;
export type NovoMeioPagamento = Omit<MeioPagamento, "id" | "criadoEm" | "atualizadoEm">;

const Ctx = createContext<ContextoDados | null>(null);

const normalizar = (v: string) => v.trim().toLowerCase();

/** Exibição da quantidade de créditos no texto do log (o valor exato fica nos metadados). */
const qtdBR = (n: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(n);

const saldoDe = (lista: MovimentacaoCredito[], servidorId: string) =>
  lista
    .filter((m) => m.servidorId === servidorId)
    .reduce((acc, m) => acc + (m.tipo === "entrada" ? m.quantidade : -m.quantidade), 0);

/** Monta o registro completo de log a partir dos dados informados. */
const montarLog = (dados: NovoLog): LogAuditoria => ({
  nivel: "info",
  ...dados,
  id: `lg${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
  dataHora: dados.dataHora ?? new Date().toISOString(),
  usuarioNome: dados.usuarioNome ?? USUARIO_PADRAO_LOG,
  origem: dados.origem ?? "manual",
});

type CampoAuditavel = {
  campo: string;
  rotulo: string;
  formato?: AlteracaoCampo["formato"];
};

type ValorAuditavel = string | number | boolean | null | undefined;

/** Compara dois registros e devolve apenas os campos que mudaram. */
const diferencas = (
  campos: CampoAuditavel[],
  antes: Record<string, ValorAuditavel>,
  depois: Record<string, ValorAuditavel>,
): AlteracaoCampo[] =>
  campos
    .filter((c) => depois[c.campo] !== undefined && antes[c.campo] !== depois[c.campo])
    .map((c) => ({
      campo: c.campo,
      rotulo: c.rotulo,
      ...(c.formato ? { formato: c.formato } : {}),
      de: antes[c.campo] ?? null,
      para: depois[c.campo] ?? null,
    }));

const camposCliente: CampoAuditavel[] = [
  { campo: "nome", rotulo: "Nome", formato: "texto" },
  { campo: "usuario", rotulo: "Usuário", formato: "texto" },
  { campo: "telefone", rotulo: "Telefone", formato: "texto" },
  { campo: "valor", rotulo: "Valor mensal", formato: "moeda" },
  { campo: "expiracao", rotulo: "Data de expiração", formato: "data" },
  { campo: "servidorId", rotulo: "Servidor", formato: "texto" },
  { campo: "aplicativo", rotulo: "Aplicativo", formato: "texto" },
  { campo: "observacoes", rotulo: "Observações", formato: "texto" },
];

const camposRevenda: CampoAuditavel[] = [
  { campo: "nome", rotulo: "Nome", formato: "texto" },
  { campo: "usuario", rotulo: "Usuário", formato: "texto" },
  { campo: "painel", rotulo: "Painel", formato: "texto" },
  { campo: "valorCredito", rotulo: "Valor de compra do crédito", formato: "moeda" },
  { campo: "observacoes", rotulo: "Observações", formato: "texto" },
];

const camposMeioPagamento: CampoAuditavel[] = [
  { campo: "nome", rotulo: "Nome", formato: "texto" },
  { campo: "tipo", rotulo: "Tipo", formato: "texto" },
  { campo: "provedor", rotulo: "Provedor", formato: "texto" },
  { campo: "ativo", rotulo: "Ativo", formato: "booleano" },
  { campo: "statusIntegracao", rotulo: "Status da integração", formato: "texto" },
];

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(estadoInicial);

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(STORAGE_KEY);
      if (bruto) setEstado({ ...estadoInicial, ...(JSON.parse(bruto) as Partial<Estado>) });
    } catch {
      /* ignora dados corrompidos */
    }
  }, []);

  /**
   * Persiste o próximo estado. Logs de auditoria só são anexados aqui,
   * ou seja, depois que a operação foi validada e concluída com sucesso.
   */
  const persistir = useCallback((proximo: Estado, novosLogs: NovoLog[] = []) => {
    const final: Estado = novosLogs.length
      ? { ...proximo, logs: [...novosLogs.map(montarLog), ...proximo.logs] }
      : proximo;
    setEstado(final);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(final));
    } catch {
      /* armazenamento indisponível */
    }
  }, []);

  /**
   * Registra um log de auditoria avulso. Usa atualização funcional para poder
   * ser chamado com segurança a partir de qualquer ação futura.
   */
  const registrarLog = useCallback((dados: NovoLog): LogAuditoria => {
    const log = montarLog(dados);
    setEstado((prev) => {
      const proximo = { ...prev, logs: [log, ...prev.logs] };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(proximo));
      } catch {
        /* armazenamento indisponível */
      }
      return proximo;
    });
    return log;
  }, []);

  const valor = useMemo<ContextoDados>(() => {
    const usuarioExiste = (usuario: string, ignorarId?: string) =>
      estado.clientes.some((c) => normalizar(c.usuario) === normalizar(usuario) && c.id !== ignorarId);

    const nomeServidor = (id: string) => estado.servidores.find((s) => s.id === id)?.nome ?? id;
    const nomeMeio = (id?: string) =>
      id ? estado.meiosPagamento.find((m) => m.id === id)?.nome ?? id : "—";

    return {
      ...estado,
      usuarioExiste,
      criarCliente: (dados) => {
        if (!dados.nome.trim()) return { ok: false, erro: "Informe o nome do cliente." };
        if (!dados.usuario.trim()) return { ok: false, erro: "Informe o usuário." };
        if (usuarioExiste(dados.usuario)) return { ok: false, erro: "Este usuário já está cadastrado no sistema." };

        const novo: Cliente = {
          ...dados,
          id: `c${Date.now()}`,
          ultimoPagamento: dados.ultimoPagamento || isoHoje(),
          valorUltimoPagamento: dados.valorUltimoPagamento ?? dados.valor,
        };
        persistir({ ...estado, clientes: [novo, ...estado.clientes] }, [
          {
            acao: "criar",
            entidade: "cliente",
            entidadeId: novo.id,
            entidadeRotulo: novo.nome,
            clienteId: novo.id,
            clienteNome: novo.nome,
            descricao: `Cliente "${novo.nome}" cadastrado.`,
            metadados: {
              usuario: novo.usuario,
              valor: novo.valor,
              expiracao: novo.expiracao,
              servidor: nomeServidor(novo.servidorId),
              aplicativo: novo.aplicativo,
            },
          },
        ]);
        return { ok: true };
      },
      atualizarCliente: (id, dados) => {
        if (!dados.nome.trim()) return { ok: false, erro: "Informe o nome do cliente." };
        if (usuarioExiste(dados.usuario, id))
          return { ok: false, erro: "Este usuário já está cadastrado no sistema." };
        const anterior = estado.clientes.find((c) => c.id === id);
        if (!anterior) return { ok: false, erro: "Cliente não encontrado." };
        const alteracoes = diferencas(
          camposCliente,
          anterior as unknown as Record<string, ValorAuditavel>,
          dados as unknown as Record<string, ValorAuditavel>,
        );
        persistir(
          {
            ...estado,
            clientes: estado.clientes.map((c) => (c.id === id ? { ...c, ...dados } : c)),
          },
          [
            {
              acao: "editar",
              entidade: "cliente",
              entidadeId: id,
              entidadeRotulo: dados.nome,
              clienteId: id,
              clienteNome: dados.nome,
              descricao: alteracoes.length
                ? `Cliente "${dados.nome}" editado — ${alteracoes.length} campo(s) alterado(s).`
                : `Cliente "${dados.nome}" salvo sem alterações de conteúdo.`,
              ...(alteracoes.length ? { alteracoes } : {}),
            },
          ],
        );
        return { ok: true };
      },
      removerCliente: (id) => {
        const alvo = estado.clientes.find((c) => c.id === id);
        if (!alvo) return;
        persistir(
          {
            ...estado,
            clientes: estado.clientes.filter((c) => c.id !== id),
            pagamentos: estado.pagamentos.filter((p) => p.clienteId !== id),
          },
          [
            {
              acao: "excluir",
              entidade: "cliente",
              entidadeId: id,
              entidadeRotulo: alvo.nome,
              clienteId: id,
              clienteNome: alvo.nome,
              nivel: "alerta",
              descricao: `Cliente "${alvo.nome}" excluído.`,
              metadados: {
                usuario: alvo.usuario,
                telefone: alvo.telefone,
                valor: alvo.valor,
                expiracao: alvo.expiracao,
                ultimoPagamento: alvo.ultimoPagamento,
                valorUltimoPagamento: alvo.valorUltimoPagamento,
                servidor: nomeServidor(alvo.servidorId),
                aplicativo: alvo.aplicativo,
                pagamentosRemovidos: estado.pagamentos.filter((p) => p.clienteId === id).length,
              },
            },
          ],
        );
      },
      renovarCliente: (id, meses, valorPago, novaData, meioPagamentoId) => {
        const data = isoHoje();
        const cliente = estado.clientes.find((c) => c.id === id);
        if (!cliente) return { ok: false, erro: "Cliente não encontrado." };

        const mesesParaCusto =
          novaData && meses === 0
            ? mesesEntre(cliente.expiracao > data ? cliente.expiracao : data, novaData)
            : meses;
        const qtdCreditos = mesesParaCusto;
        const saldo = saldoDe(estado.movimentacoes, cliente.servidorId);
        if (qtdCreditos > saldo)
          return { ok: false, erro: `Créditos insuficientes no servidor. Saldo disponível: ${saldo} crédito(s).` };

        const pagamentoId = `p${Date.now()}`;
        const base = cliente.expiracao > data ? cliente.expiracao : data;
        const novaExpiracao = novaData ?? somarMeses(base, meses);
        const personalizada = Boolean(novaData);
        const clientesAtualizados = estado.clientes.map((c) => {
          if (c.id !== id) return c;
          return {
            ...c,
            expiracao: novaExpiracao,
            ultimoPagamento: data,
            valorUltimoPagamento: valorPago,
          };
        });
        const pagamento: Pagamento = {
          id: pagamentoId,
          clienteId: id,
          data,
          valor: valorPago,
          status: "pago",
          tipo: "renovação",
          ...(meioPagamentoId ? { meioPagamentoId } : {}),
          origem: "manual",
        };
        const movId = `mv${Date.now()}`;
        const mov: MovimentacaoCredito = {
          id: movId,
          servidorId: cliente.servidorId,
          tipo: "saida_renovacao",
          quantidade: qtdCreditos,
          data,
          pagamentoId,
          clienteId: id,
          observacoes: `Renovação — ${mesesParaCusto.toFixed(1).replace(".0", "")} mês(es)`,
        };
        persistir(
          {
            ...estado,
            clientes: clientesAtualizados,
            pagamentos: [pagamento, ...estado.pagamentos],
            movimentacoes: [mov, ...estado.movimentacoes],
          },
          [
            {
              acao: personalizada ? "renovar_personalizado" : "renovar",
              entidade: "renovacao",
              entidadeId: pagamentoId,
              entidadeRotulo: cliente.nome,
              clienteId: id,
              clienteNome: cliente.nome,
              descricao: personalizada
                ? `Renovação personalizada de "${cliente.nome}" até ${dateBR(novaExpiracao)}.`
                : `Renovação de "${cliente.nome}" por ${meses} mês(es).`,
              alteracoes: [
                {
                  campo: "expiracao",
                  rotulo: "Data de expiração",
                  formato: "data",
                  de: cliente.expiracao,
                  para: novaExpiracao,
                },
                {
                  campo: "ultimoPagamento",
                  rotulo: "Último pagamento",
                  formato: "data",
                  de: cliente.ultimoPagamento,
                  para: data,
                },
                {
                  campo: "valorUltimoPagamento",
                  rotulo: "Valor do último pagamento",
                  formato: "moeda",
                  de: cliente.valorUltimoPagamento,
                  para: valorPago,
                },
              ],
              metadados: {
                tipoRenovacao: personalizada ? "personalizada" : "normal",
                periodoMeses: meses,
                periodoCalculado: mesesParaCusto,
                dataEscolhida: personalizada ? novaExpiracao : null,
                valorRecebido: valorPago,
                meioPagamento: nomeMeio(meioPagamentoId),
                servidor: nomeServidor(cliente.servidorId),
                creditosConsumidos: qtdCreditos,
                pagamentoId,
                movimentacaoId: movId,
              },
            },
            {
              acao: "saida_credito",
              entidade: "credito",
              entidadeId: movId,
              entidadeRotulo: nomeServidor(cliente.servidorId),
              clienteId: id,
              clienteNome: cliente.nome,
              descricao: `Saída de ${qtdBR(qtdCreditos)} crédito(s) em ${nomeServidor(cliente.servidorId)} por renovação.`,
              metadados: {
                tipoMovimentacao: "saida_renovacao",
                servidor: nomeServidor(cliente.servidorId),
                servidorId: cliente.servidorId,
                quantidade: qtdCreditos,
                saldoAnterior: saldo,
                saldoPosterior: saldo - qtdCreditos,
                pagamentoId,
                data,
              },
            },
          ],
        );
        return { ok: true };
      },
      pagamentosDoCliente: (clienteId) =>
        estado.pagamentos.filter((p) => p.clienteId === clienteId).sort((a, b) => b.data.localeCompare(a.data)),
      restaurarDemo: () => persistir(estadoInicial),

      revendaUsuarioExiste: (usuario, ignorarId) =>
        estado.revendas.some((r) => normalizar(r.usuario) === normalizar(usuario) && r.id !== ignorarId),
      criarRevenda: (dadosRevenda) => {
        if (!dadosRevenda.nome.trim()) return { ok: false, erro: "Informe o nome da revenda." };
        if (!dadosRevenda.usuario.trim()) return { ok: false, erro: "Informe o usuário." };
        if (estado.revendas.some((r) => normalizar(r.usuario) === normalizar(dadosRevenda.usuario)))
          return { ok: false, erro: "Este usuário já está cadastrado no sistema." };
        const nova: Revenda = {
          ...dadosRevenda,
          id: `r${Date.now()}`,
          ultimaRecarga: dadosRevenda.ultimaRecarga ?? "",
        };
        persistir({ ...estado, revendas: [nova, ...estado.revendas] }, [
          {
            acao: "criar",
            entidade: "revenda",
            entidadeId: nova.id,
            entidadeRotulo: nova.nome,
            descricao: `Revenda "${nova.nome}" cadastrada.`,
            metadados: {
              usuario: nova.usuario,
              painel: nova.painel,
              valorCredito: nova.valorCredito,
            },
          },
        ]);
        return { ok: true };
      },
      atualizarRevenda: (id, dadosRevenda) => {
        if (!dadosRevenda.nome.trim()) return { ok: false, erro: "Informe o nome da revenda." };
        if (estado.revendas.some((r) => normalizar(r.usuario) === normalizar(dadosRevenda.usuario) && r.id !== id))
          return { ok: false, erro: "Este usuário já está cadastrado no sistema." };
        const anterior = estado.revendas.find((r) => r.id === id);
        if (!anterior) return { ok: false, erro: "Revenda não encontrada." };
        const alteracoes = diferencas(
          camposRevenda,
          anterior as unknown as Record<string, ValorAuditavel>,
          dadosRevenda as unknown as Record<string, ValorAuditavel>,
        );
        persistir(
          {
            ...estado,
            revendas: estado.revendas.map((r) => (r.id === id ? { ...r, ...dadosRevenda } : r)),
          },
          [
            {
              acao: "editar",
              entidade: "revenda",
              entidadeId: id,
              entidadeRotulo: dadosRevenda.nome,
              descricao: alteracoes.length
                ? `Revenda "${dadosRevenda.nome}" editada — ${alteracoes.length} campo(s) alterado(s).`
                : `Revenda "${dadosRevenda.nome}" salva sem alterações de conteúdo.`,
              ...(alteracoes.length ? { alteracoes } : {}),
            },
          ],
        );
        return { ok: true };
      },
      removerRevenda: (id) => {
        const alvo = estado.revendas.find((r) => r.id === id);
        if (!alvo) return;
        persistir(
          {
            ...estado,
            revendas: estado.revendas.filter((r) => r.id !== id),
            recargas: estado.recargas.filter((r) => r.revendaId !== id),
          },
          [
            {
              acao: "excluir",
              entidade: "revenda",
              entidadeId: id,
              entidadeRotulo: alvo.nome,
              nivel: "alerta",
              descricao: `Revenda "${alvo.nome}" excluída.`,
              metadados: {
                usuario: alvo.usuario,
                painel: alvo.painel,
                valorCredito: alvo.valorCredito,
                ultimaRecarga: alvo.ultimaRecarga || "—",
                recargasRemovidas: estado.recargas.filter((r) => r.revendaId === id).length,
              },
            },
          ],
        );
      },
      registrarRecarga: (dadosRecarga) => {
        const revenda = estado.revendas.find((r) => r.id === dadosRecarga.revendaId);
        if (!revenda) return { ok: false, erro: "Revenda não encontrada." };
        const servidor = estado.servidores.find((s) => s.id === dadosRecarga.servidorId && s.ativo);
        if (!servidor) return { ok: false, erro: "Selecione um servidor ativo." };
        const saldo = saldoDe(estado.movimentacoes, servidor.id);
        if (dadosRecarga.quantidade > saldo)
          return { ok: false, erro: `Créditos insuficientes no servidor. Saldo disponível: ${saldo} crédito(s).` };

        const recargaId = `rc${Date.now()}`;
        const recarga: RecargaRevenda = {
          ...dadosRecarga,
          custoCredito: servidor.custoCredito,
          custoTotal: servidor.custoCredito * dadosRecarga.quantidade,
          lucro: dadosRecarga.valorCobrado - servidor.custoCredito * dadosRecarga.quantidade,
          id: recargaId,
        };
        const movId = `mv${Date.now()}`;
        const mov: MovimentacaoCredito = {
          id: movId,
          servidorId: servidor.id,
          tipo: "saida_recarga" as TipoMovimentacao,
          quantidade: dadosRecarga.quantidade,
          data: dadosRecarga.data,
          recargaId,
          revendaId: dadosRecarga.revendaId,
          observacoes: "Recarga de revenda",
        };
        persistir(
          {
            ...estado,
            recargas: [recarga, ...estado.recargas],
            revendas: estado.revendas.map((r) =>
              r.id === recarga.revendaId ? { ...r, ultimaRecarga: recarga.data } : r,
            ),
            movimentacoes: [mov, ...estado.movimentacoes],
          },
          [
            {
              acao: "registrar_recarga",
              entidade: "recarga",
              entidadeId: recargaId,
              entidadeRotulo: revenda.nome,
              descricao: `Recarga de ${recarga.quantidade} crédito(s) para "${revenda.nome}" em ${servidor.nome}.`,
              metadados: {
                revenda: revenda.nome,
                revendaId: revenda.id,
                servidor: servidor.nome,
                servidorId: servidor.id,
                quantidade: recarga.quantidade,
                valorCobrado: recarga.valorCobrado,
                custoCredito: recarga.custoCredito,
                custoTotal: recarga.custoTotal,
                lucro: recarga.lucro,
                data: recarga.data,
                observacoes: recarga.observacoes || "—",
                movimentacaoId: movId,
              },
            },
            {
              acao: "saida_credito",
              entidade: "credito",
              entidadeId: movId,
              entidadeRotulo: servidor.nome,
              descricao: `Saída de ${recarga.quantidade} crédito(s) em ${servidor.nome} por recarga de revenda.`,
              metadados: {
                tipoMovimentacao: "saida_recarga",
                servidor: servidor.nome,
                servidorId: servidor.id,
                revenda: revenda.nome,
                revendaId: revenda.id,
                quantidade: recarga.quantidade,
                saldoAnterior: saldo,
                saldoPosterior: saldo - recarga.quantidade,
                recargaId,
                data: recarga.data,
              },
            },
          ],
        );
        return { ok: true };
      },
      recargasDaRevenda: (revendaId) =>
        estado.recargas.filter((r) => r.revendaId === revendaId).sort((a, b) => b.data.localeCompare(a.data)),

      saldoServidor: (servidorId) => saldoDe(estado.movimentacoes, servidorId),
      registrarEntradaCreditos: (servidorId, quantidade, obs) => {
        const servidor = estado.servidores.find((s) => s.id === servidorId);
        if (!servidor) return { ok: false, erro: "Servidor não encontrado." };
        if (quantidade <= 0) return { ok: false, erro: "A quantidade deve ser maior que zero." };
        const saldo = saldoDe(estado.movimentacoes, servidorId);
        const movId = `mv${Date.now()}`;
        const mov: MovimentacaoCredito = {
          id: movId,
          servidorId,
          tipo: "entrada",
          quantidade,
          data: isoHoje(),
          observacoes: obs ?? "Compra de créditos",
        };
        persistir({ ...estado, movimentacoes: [mov, ...estado.movimentacoes] }, [
          {
            acao: "entrada_credito",
            entidade: "credito",
            entidadeId: movId,
            entidadeRotulo: servidor.nome,
            descricao: `Entrada de ${quantidade} crédito(s) em ${servidor.nome}.`,
            metadados: {
              tipoMovimentacao: "entrada",
              servidor: servidor.nome,
              servidorId,
              quantidade,
              saldoAnterior: saldo,
              saldoPosterior: saldo + quantidade,
              observacoes: mov.observacoes ?? "—",
              data: mov.data,
            },
          },
        ]);
        return { ok: true };
      },
      movimentacoesDoServidor: (servidorId) =>
        estado.movimentacoes
          .filter((m) => m.servidorId === servidorId)
          .sort((a, b) => b.data.localeCompare(a.data)),

      criarDespesa: (dadosDespesa) => {
        if (!dadosDespesa.descricao.trim()) return { ok: false, erro: "Informe a descrição da despesa." };
        if (dadosDespesa.valor <= 0) return { ok: false, erro: "O valor deve ser maior que zero." };
        const nova: Despesa = { ...dadosDespesa, id: `d${Date.now()}` };
        persistir({ ...estado, despesas: [nova, ...estado.despesas] });
        return { ok: true };
      },
      removerDespesa: (id) => {
        persistir({ ...estado, despesas: estado.despesas.filter((d) => d.id !== id) });
      },

      criarMeioPagamento: (dadosMeio) => {
        if (!dadosMeio.nome.trim()) return { ok: false, erro: "Informe o nome do meio de pagamento." };
        const agora = isoHoje();
        const novo: MeioPagamento = {
          ...dadosMeio,
          id: `mp${Date.now()}`,
          criadoEm: agora,
          atualizadoEm: agora,
        };
        persistir({ ...estado, meiosPagamento: [novo, ...estado.meiosPagamento] }, [
          {
            acao: "criar",
            entidade: "meio_pagamento",
            entidadeId: novo.id,
            entidadeRotulo: novo.nome,
            descricao: `Meio de pagamento "${novo.nome}" criado.`,
            metadados: {
              tipo: novo.tipo,
              provedor: novo.provedor,
              ativo: novo.ativo,
              statusIntegracao: novo.statusIntegracao,
            },
          },
        ]);
        return { ok: true };
      },
      atualizarMeioPagamento: (id, dadosMeio) => {
        if (!dadosMeio.nome.trim()) return { ok: false, erro: "Informe o nome do meio de pagamento." };
        const anterior = estado.meiosPagamento.find((m) => m.id === id);
        if (!anterior) return { ok: false, erro: "Meio de pagamento não encontrado." };
        const alteracoes = diferencas(
          camposMeioPagamento,
          anterior as unknown as Record<string, ValorAuditavel>,
          dadosMeio as unknown as Record<string, ValorAuditavel>,
        );
        persistir(
          {
            ...estado,
            meiosPagamento: estado.meiosPagamento.map((m) =>
              m.id === id ? { ...m, ...dadosMeio, atualizadoEm: isoHoje() } : m,
            ),
          },
          [
            {
              acao: "editar",
              entidade: "meio_pagamento",
              entidadeId: id,
              entidadeRotulo: dadosMeio.nome,
              descricao: alteracoes.length
                ? `Meio de pagamento "${dadosMeio.nome}" editado — ${alteracoes.length} campo(s) alterado(s).`
                : `Meio de pagamento "${dadosMeio.nome}" salvo sem alterações de conteúdo.`,
              ...(alteracoes.length ? { alteracoes } : {}),
            },
          ],
        );
        return { ok: true };
      },
      removerMeioPagamento: (id) => {
        const emUso = estado.pagamentos.some((p) => p.meioPagamentoId === id);
        if (emUso) return { ok: false, erro: "Este meio de pagamento possui pagamentos vinculados e não pode ser excluído." };
        const alvo = estado.meiosPagamento.find((m) => m.id === id);
        if (!alvo) return { ok: false, erro: "Meio de pagamento não encontrado." };
        persistir({ ...estado, meiosPagamento: estado.meiosPagamento.filter((m) => m.id !== id) }, [
          {
            acao: "excluir",
            entidade: "meio_pagamento",
            entidadeId: id,
            entidadeRotulo: alvo.nome,
            nivel: "alerta",
            descricao: `Meio de pagamento "${alvo.nome}" excluído.`,
            metadados: {
              tipo: alvo.tipo,
              provedor: alvo.provedor,
              statusIntegracao: alvo.statusIntegracao,
            },
          },
        ]);
        return { ok: true };
      },
      toggleMeioPagamento: (id) => {
        const alvo = estado.meiosPagamento.find((m) => m.id === id);
        if (!alvo) return;
        persistir(
          {
            ...estado,
            meiosPagamento: estado.meiosPagamento.map((m) =>
              m.id === id
                ? { ...m, ativo: !m.ativo, atualizadoEm: isoHoje() }
                : m,
            ),
          },
          [
            {
              acao: "editar",
              entidade: "meio_pagamento",
              entidadeId: id,
              entidadeRotulo: alvo.nome,
              descricao: `Meio de pagamento "${alvo.nome}" ${alvo.ativo ? "desativado" : "ativado"}.`,
              alteracoes: [
                { campo: "ativo", rotulo: "Ativo", formato: "booleano", de: alvo.ativo, para: !alvo.ativo },
              ],
            },
          ],
        );
      },
      meiosPagamentoAtivos: () => estado.meiosPagamento.filter((m) => m.ativo),
      nomeMeioPagamento: (id) => {
        if (!id) return "—";
        return estado.meiosPagamento.find((m) => m.id === id)?.nome ?? "—";
      },

      registrarLog,
      logsDoCliente: (clienteId) =>
        estado.logs
          .filter((l) => l.clienteId === clienteId)
          .sort((a, b) => b.dataHora.localeCompare(a.dataHora)),
      usuariosDosLogs: () => Array.from(new Set(estado.logs.map((l) => l.usuarioNome))).sort(),
    };
  }, [estado, persistir, registrarLog]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAppData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppData precisa estar dentro de AppDataProvider");
  return ctx;
}
