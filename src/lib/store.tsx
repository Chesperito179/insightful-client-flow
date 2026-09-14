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

const STORAGE_KEY = "meridian.dados.v1";

interface Estado {
  clientes: Cliente[];
  servidores: Servidor[];
  pagamentos: Pagamento[];
  revendas: Revenda[];
  recargas: RecargaRevenda[];
  movimentacoes: MovimentacaoCredito[];
  despesas: Despesa[];
}

const estadoInicial: Estado = {
  clientes: clientesSeed,
  servidores: servidoresSeed,
  pagamentos: pagamentosSeed,
  revendas: revendasSeed,
  recargas: recargasSeed,
  movimentacoes: movimentacoesSeed,
  despesas: despesasSeed,
};

export type NovoCliente = Omit<Cliente, "id" | "ultimoPagamento" | "valorUltimoPagamento"> &
  Partial<Pick<Cliente, "ultimoPagamento" | "valorUltimoPagamento">>;

interface ContextoDados extends Estado {
  usuarioExiste: (usuario: string, ignorarId?: string) => boolean;
  criarCliente: (dados: NovoCliente) => { ok: boolean; erro?: string };
  atualizarCliente: (id: string, dados: NovoCliente) => { ok: boolean; erro?: string };
  removerCliente: (id: string) => void;
  renovarCliente: (id: string, meses: number, valor: number, novaData?: string) => { ok: boolean; erro?: string };
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
}

export type NovaRevenda = Omit<Revenda, "id" | "ultimaRecarga"> & Partial<Pick<Revenda, "ultimaRecarga">>;
export type NovaRecarga = Omit<RecargaRevenda, "id" | "custoCredito" | "custoTotal" | "lucro">;
export type NovaDespesa = Omit<Despesa, "id">;

const Ctx = createContext<ContextoDados | null>(null);

const normalizar = (v: string) => v.trim().toLowerCase();

const saldoDe = (lista: MovimentacaoCredito[], servidorId: string) =>
  lista
    .filter((m) => m.servidorId === servidorId)
    .reduce((acc, m) => acc + (m.tipo === "entrada" ? m.quantidade : -m.quantidade), 0);

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

  const persistir = useCallback((proximo: Estado) => {
    setEstado(proximo);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(proximo));
    } catch {
      /* armazenamento indisponível */
    }
  }, []);

  const valor = useMemo<ContextoDados>(() => {
    const usuarioExiste = (usuario: string, ignorarId?: string) =>
      estado.clientes.some((c) => normalizar(c.usuario) === normalizar(usuario) && c.id !== ignorarId);

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
        persistir({ ...estado, clientes: [novo, ...estado.clientes] });
        return { ok: true };
      },
      atualizarCliente: (id, dados) => {
        if (!dados.nome.trim()) return { ok: false, erro: "Informe o nome do cliente." };
        if (usuarioExiste(dados.usuario, id))
          return { ok: false, erro: "Este usuário já está cadastrado no sistema." };
        persistir({
          ...estado,
          clientes: estado.clientes.map((c) => (c.id === id ? { ...c, ...dados } : c)),
        });
        return { ok: true };
      },
      removerCliente: (id) => {
        persistir({
          ...estado,
          clientes: estado.clientes.filter((c) => c.id !== id),
          pagamentos: estado.pagamentos.filter((p) => p.clienteId !== id),
        });
      },
      renovarCliente: (id, meses, valorPago, novaData) => {
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
        const clientesAtualizados = estado.clientes.map((c) => {
          if (c.id !== id) return c;
          const base = c.expiracao > data ? c.expiracao : data;
          return {
            ...c,
            expiracao: novaData ?? somarMeses(base, meses),
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
        };
        const mov: MovimentacaoCredito = {
          id: `mv${Date.now()}`,
          servidorId: cliente.servidorId,
          tipo: "saida_renovacao",
          quantidade: qtdCreditos,
          data,
          pagamentoId,
          clienteId: id,
          observacoes: `Renovação — ${mesesParaCusto.toFixed(1).replace(".0", "")} mês(es)`,
        };
        persistir({
          ...estado,
          clientes: clientesAtualizados,
          pagamentos: [pagamento, ...estado.pagamentos],
          movimentacoes: [mov, ...estado.movimentacoes],
        });
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
        persistir({ ...estado, revendas: [nova, ...estado.revendas] });
        return { ok: true };
      },
      atualizarRevenda: (id, dadosRevenda) => {
        if (!dadosRevenda.nome.trim()) return { ok: false, erro: "Informe o nome da revenda." };
        if (estado.revendas.some((r) => normalizar(r.usuario) === normalizar(dadosRevenda.usuario) && r.id !== id))
          return { ok: false, erro: "Este usuário já está cadastrado no sistema." };
        persistir({
          ...estado,
          revendas: estado.revendas.map((r) => (r.id === id ? { ...r, ...dadosRevenda } : r)),
        });
        return { ok: true };
      },
      removerRevenda: (id) => {
        persistir({
          ...estado,
          revendas: estado.revendas.filter((r) => r.id !== id),
          recargas: estado.recargas.filter((r) => r.revendaId !== id),
        });
      },
      registrarRecarga: (dadosRecarga) => {
        if (!estado.revendas.some((r) => r.id === dadosRecarga.revendaId))
          return { ok: false, erro: "Revenda não encontrada." };
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
        const mov: MovimentacaoCredito = {
          id: `mv${Date.now()}`,
          servidorId: servidor.id,
          tipo: "saida_recarga" as TipoMovimentacao,
          quantidade: dadosRecarga.quantidade,
          data: dadosRecarga.data,
          recargaId,
          revendaId: dadosRecarga.revendaId,
          observacoes: "Recarga de revenda",
        };
        persistir({
          ...estado,
          recargas: [recarga, ...estado.recargas],
          revendas: estado.revendas.map((r) =>
            r.id === recarga.revendaId ? { ...r, ultimaRecarga: recarga.data } : r,
          ),
          movimentacoes: [mov, ...estado.movimentacoes],
        });
        return { ok: true };
      },
      recargasDaRevenda: (revendaId) =>
        estado.recargas.filter((r) => r.revendaId === revendaId).sort((a, b) => b.data.localeCompare(a.data)),

      saldoServidor: (servidorId) => saldoDe(estado.movimentacoes, servidorId),
      registrarEntradaCreditos: (servidorId, quantidade, obs) => {
        const servidor = estado.servidores.find((s) => s.id === servidorId);
        if (!servidor) return { ok: false, erro: "Servidor não encontrado." };
        if (quantidade <= 0) return { ok: false, erro: "A quantidade deve ser maior que zero." };
        const mov: MovimentacaoCredito = {
          id: `mv${Date.now()}`,
          servidorId,
          tipo: "entrada",
          quantidade,
          data: isoHoje(),
          observacoes: obs ?? "Compra de créditos",
        };
        persistir({ ...estado, movimentacoes: [mov, ...estado.movimentacoes] });
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
    };
  }, [estado, persistir]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAppData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppData precisa estar dentro de AppDataProvider");
  return ctx;
}
