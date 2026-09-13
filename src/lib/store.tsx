import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  clientes as clientesSeed,
  isoHoje,
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

const STORAGE_KEY = "meridian.dados.v1";

interface Estado {
  clientes: Cliente[];
  servidores: Servidor[];
  pagamentos: Pagamento[];
  revendas: Revenda[];
  recargas: RecargaRevenda[];
}

const estadoInicial: Estado = {
  clientes: clientesSeed,
  servidores: servidoresSeed,
  pagamentos: pagamentosSeed,
  revendas: revendasSeed,
  recargas: recargasSeed,
};

export type NovoCliente = Omit<Cliente, "id" | "ultimoPagamento" | "valorUltimoPagamento"> &
  Partial<Pick<Cliente, "ultimoPagamento" | "valorUltimoPagamento">>;

interface ContextoDados extends Estado {
  usuarioExiste: (usuario: string, ignorarId?: string) => boolean;
  criarCliente: (dados: NovoCliente) => { ok: boolean; erro?: string };
  atualizarCliente: (id: string, dados: NovoCliente) => { ok: boolean; erro?: string };
  removerCliente: (id: string) => void;
  renovarCliente: (id: string, meses: number, valor: number, novaData?: string) => void;
  pagamentosDoCliente: (clienteId: string) => Pagamento[];
  restaurarDemo: () => void;
  // Revendas
  revendaUsuarioExiste: (usuario: string, ignorarId?: string) => boolean;
  criarRevenda: (dados: NovaRevenda) => { ok: boolean; erro?: string };
  atualizarRevenda: (id: string, dados: NovaRevenda) => { ok: boolean; erro?: string };
  removerRevenda: (id: string) => void;
  registrarRecarga: (dados: NovaRecarga) => { ok: boolean; erro?: string };
  recargasDaRevenda: (revendaId: string) => RecargaRevenda[];
}

export type NovaRevenda = Omit<Revenda, "id" | "ultimaRecarga"> & Partial<Pick<Revenda, "ultimaRecarga">>;
export type NovaRecarga = Omit<RecargaRevenda, "id">;

const Ctx = createContext<ContextoDados | null>(null);

const normalizar = (v: string) => v.trim().toLowerCase();

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(estadoInicial);

  // Persistência local (substituível por banco de dados nas próximas etapas).
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
          id: `p${Date.now()}`,
          clienteId: id,
          data,
          valor: valorPago,
          status: "pago",
          tipo: "renovação",
        };
        persistir({ ...estado, clientes: clientesAtualizados, pagamentos: [pagamento, ...estado.pagamentos] });
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
        const recarga: RecargaRevenda = { ...dadosRecarga, id: `rc${Date.now()}` };
        persistir({
          ...estado,
          recargas: [recarga, ...estado.recargas],
          revendas: estado.revendas.map((r) =>
            r.id === recarga.revendaId ? { ...r, ultimaRecarga: recarga.data } : r,
          ),
        });
        return { ok: true };
      },
      recargasDaRevenda: (revendaId) =>
        estado.recargas.filter((r) => r.revendaId === revendaId).sort((a, b) => b.data.localeCompare(a.data)),
    };
  }, [estado, persistir]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAppData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppData precisa estar dentro de AppDataProvider");
  return ctx;
}
