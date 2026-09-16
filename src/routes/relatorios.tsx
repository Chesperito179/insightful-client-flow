import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { clienteDe, diasAteExpirar, hoje, servidorDe, statusExpiracao } from "@/lib/data";
import { brl, num, percent } from "@/lib/format";
import { type Periodo, periodoRange, dentroDe, periodoLabel } from "@/lib/periodo";
import { useAppData } from "@/lib/store";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Meridian Control" },
      {
        name: "description",
        content: "Faturamento, lucro, base de clientes e receita por servidor e aplicativo.",
      },
      { property: "og:title", content: "Relatórios — Meridian Control" },
      {
        property: "og:description",
        content: "Faturamento, lucro, base de clientes e receita por servidor e aplicativo.",
      },
    ],
  }),
  component: RelatoriosPage,
});

const CORES_GRAFICO = ["var(--color-success)", "var(--color-warning)", "var(--color-danger)"];

interface Lancamento {
  id: string;
  data: string;
  descricao: string;
  categoria: "cliente" | "revenda" | "despesa";
  receita: number;
  custo: number;
  lucro: number;
}

function RelatoriosPage() {
  const dados = useAppData();
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const range = useMemo(() => periodoRange(periodo, hoje()), [periodo]);
  const pLabel = periodoLabel(periodo);

  const resumo = useMemo(() => {
    const pagamentosPeriodo = dados.pagamentos.filter((p) => dentroDe(p.data, range));
    const recebido = pagamentosPeriodo
      .filter((p) => p.status === "pago")
      .reduce((s, p) => s + p.valor, 0);

    const custoCreditos = pagamentosPeriodo
      .filter((p) => p.status === "pago")
      .reduce((s, p) => {
        const mov = dados.movimentacoes.find((m) => m.pagamentoId === p.id);
        const cliente = clienteDe(p.clienteId, dados.clientes);
        const servidor = cliente ? servidorDe(cliente, dados.servidores) : null;
        return s + (servidor && mov ? servidor.custoCredito * mov.quantidade : 0);
      }, 0);

    const recargasPeriodo = dados.recargas.filter((r) => dentroDe(r.data, range));
    const receitaRecargas = recargasPeriodo.reduce((s, r) => s + r.valorCobrado, 0);
    const custoRecargas = recargasPeriodo.reduce((s, r) => s + r.custoTotal, 0);
    const lucroRecargas = recargasPeriodo.reduce((s, r) => s + r.lucro, 0);

    const totalDespesas = dados.despesas
      .filter((d) => dentroDe(d.data, range))
      .reduce((s, d) => s + d.valor, 0);

    const novosClientes = dados.clientes.filter((c) => dentroDe(c.ultimoPagamento, range)).length;

    const clientesVenceram = dados.clientes.filter((c) => {
      const d = new Date(`${c.expiracao}T12:00:00`);
      return d >= range.inicio && d <= range.fim && statusExpiracao(c.expiracao) === "vencido";
    }).length;

    const lucroEstimado = recebido - custoCreditos + lucroRecargas - totalDespesas;

    return {
      recebido,
      custoCreditos,
      totalDespesas,
      lucroEstimado,
      novosClientes,
      clientesVenceram,
      receitaRecargas,
      custoRecargas,
    };
  }, [dados, range]);

  const relatorioClientes = useMemo(() => {
    const total = dados.clientes.length;
    const ativos = dados.clientes.filter((c) => statusExpiracao(c.expiracao) === "ativo").length;
    const vencidos = dados.clientes.filter((c) => statusExpiracao(c.expiracao) === "vencido").length;
    const vencendo7 = dados.clientes.filter((c) => {
      const d = diasAteExpirar(c.expiracao);
      return d >= 0 && d <= 7;
    }).length;
    const vencendo30 = dados.clientes.filter((c) => {
      const d = diasAteExpirar(c.expiracao);
      return d >= 0 && d <= 30;
    }).length;
    const novosNoPeriodo = dados.clientes.filter((c) => dentroDe(c.ultimoPagamento, range)).length;
    return { total, ativos, vencidos, vencendo7, vencendo30, novosNoPeriodo };
  }, [dados.clientes, range]);

  const receitaPorServidor = useMemo(() => {
    return dados.servidores.map((s) => {
      const pagosDoServidor = dados.pagamentos.filter((p) => {
        if (!dentroDe(p.data, range) || p.status !== "pago") return false;
        const cliente = clienteDe(p.clienteId, dados.clientes);
        return cliente?.servidorId === s.id;
      });
      const receita = pagosDoServidor.reduce((sum, p) => sum + p.valor, 0);
      const custo = pagosDoServidor.reduce((sum, p) => {
        const mov = dados.movimentacoes.find((m) => m.pagamentoId === p.id);
        return sum + (mov ? s.custoCredito * mov.quantidade : 0);
      }, 0);
      return {
        id: s.id,
        nome: s.nome,
        receita,
        custo,
        lucro: receita - custo,
      };
    });
  }, [dados.servidores, dados.pagamentos, dados.clientes, dados.movimentacoes, range]);

  const receitaPorAplicativo = useMemo(() => {
    const mapa = new Map<string, { aplicativo: string; clientes: number; receita: number }>();
    for (const c of dados.clientes) {
      const entry = mapa.get(c.aplicativo) ?? { aplicativo: c.aplicativo, clientes: 0, receita: 0 };
      entry.clientes += 1;
      const pagamento = dados.pagamentos.find(
        (p) => p.clienteId === c.id && dentroDe(p.data, range) && p.status === "pago",
      );
      if (pagamento) entry.receita += pagamento.valor;
      mapa.set(c.aplicativo, entry);
    }
    return [...mapa.values()].sort((a, b) => b.receita - a.receita);
  }, [dados.clientes, dados.pagamentos, range]);

  const relatorioRevendas = useMemo(() => {
    const recargasPeriodo = dados.recargas.filter((r) => dentroDe(r.data, range));
    const totalRecargas = recargasPeriodo.length;
    const receita = recargasPeriodo.reduce((s, r) => s + r.valorCobrado, 0);
    const custo = recargasPeriodo.reduce((s, r) => s + r.custoTotal, 0);
    const lucro = recargasPeriodo.reduce((s, r) => s + r.lucro, 0);

    const porRevenda = dados.revendas.map((rev) => {
      const recargasRev = recargasPeriodo.filter((r) => r.revendaId === rev.id);
      return {
        id: rev.id,
        nome: rev.nome,
        recargas: recargasRev.length,
        receita: recargasRev.reduce((s, r) => s + r.valorCobrado, 0),
        custo: recargasRev.reduce((s, r) => s + r.custoTotal, 0),
        lucro: recargasRev.reduce((s, r) => s + r.lucro, 0),
      };
    });

    return { totalRecargas, receita, custo, lucro, porRevenda };
  }, [dados.recargas, dados.revendas, range]);

  const lancamentos = useMemo<Lancamento[]>(() => {
    const itens: Lancamento[] = [];

    for (const p of dados.pagamentos) {
      if (!dentroDe(p.data, range) || p.status !== "pago") continue;
      const cliente = clienteDe(p.clienteId, dados.clientes);
      const servidor = cliente ? servidorDe(cliente, dados.servidores) : null;
      const mov = dados.movimentacoes.find((m) => m.pagamentoId === p.id);
      const custo = servidor && mov ? servidor.custoCredito * mov.quantidade : 0;
      itens.push({
        id: p.id,
        data: p.data,
        descricao: cliente?.nome ?? "Cliente removido",
        categoria: "cliente",
        receita: p.valor,
        custo,
        lucro: p.valor - custo,
      });
    }

    for (const rc of dados.recargas) {
      if (!dentroDe(rc.data, range)) continue;
      const revenda = dados.revendas.find((r) => r.id === rc.revendaId);
      itens.push({
        id: rc.id,
        data: rc.data,
        descricao: `Recarga — ${revenda?.nome ?? "Revenda removida"}`,
        categoria: "revenda",
        receita: rc.valorCobrado,
        custo: rc.custoTotal,
        lucro: rc.lucro,
      });
    }

    for (const d of dados.despesas) {
      if (!dentroDe(d.data, range)) continue;
      itens.push({
        id: d.id,
        data: d.data,
        descricao: d.descricao,
        categoria: "despesa",
        receita: 0,
        custo: d.valor,
        lucro: -d.valor,
      });
    }

    return itens.sort((a, b) => b.data.localeCompare(a.data));
  }, [dados, range]);

  const dadosGraficoFinanceiro = [
    { nome: "Receita", valor: resumo.recebido + resumo.receitaRecargas },
    { nome: "Custos", valor: resumo.custoCreditos + resumo.custoRecargas },
    { nome: "Lucro", valor: resumo.lucroEstimado },
  ];

  const dadosGraficoServidor = receitaPorServidor
    .filter((s) => s.receita > 0)
    .map((s) => ({ nome: s.nome, Receita: s.receita, Lucro: s.lucro }));

  const dadosGraficoStatus = [
    { nome: "Ativos", valor: relatorioClientes.ativos },
    { nome: "Vencidos", valor: relatorioClientes.vencidos },
    { nome: "Venc. 7d", valor: relatorioClientes.vencendo7 },
  ];

  const kpis = [
    { label: "Receita recebida", value: brl(resumo.recebido + resumo.receitaRecargas), tone: "text-success", destaque: true },
    { label: "Custos de créditos", value: brl(resumo.custoCreditos + resumo.custoRecargas), tone: "text-warning" },
    { label: "Despesas", value: brl(resumo.totalDespesas), tone: "text-danger" },
    { label: "Lucro estimado", value: brl(resumo.lucroEstimado), tone: "text-foreground" },
    { label: "Novos clientes", value: num(resumo.novosClientes), tone: "text-foreground" },
    { label: "Clientes que venceram", value: num(resumo.clientesVenceram), tone: "text-danger" },
  ];

  return (
    <AppShell titulo="Relatórios" subtitulo="análise de dados do sistema" alertas={3}>
      <section className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-border/60 bg-panel/40 p-1 backdrop-blur-md">
          {(["mes", "anterior", "30dias"] as Periodo[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodo(p)}
              className={`rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                periodo === p
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {periodoLabel(p)}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className={`animate-rise block rounded-xl p-4 backdrop-blur-md ${
              kpi.destaque
                ? "border border-success/25 bg-success/[0.06]"
                : "border border-border/60 bg-panel/40"
            }`}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <p className={`label-mono ${kpi.destaque ? "text-success/70" : ""}`}>{kpi.label}</p>
            <p className={`mt-1.5 font-mono text-2xl font-medium ${kpi.tone}`}>{kpi.value}</p>
          </div>
        ))}
      </section>

      <section
        className="animate-rise rounded-xl border border-border/60 bg-panel/30 p-4 backdrop-blur-md"
        style={{ animationDelay: "240ms" }}
      >
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Clientes</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Total", value: num(relatorioClientes.total), tone: "text-foreground" },
            { label: "Ativos", value: num(relatorioClientes.ativos), tone: "text-success" },
            { label: "Vencidos", value: num(relatorioClientes.vencidos), tone: "text-danger" },
            { label: "Venc. 7 dias", value: num(relatorioClientes.vencendo7), tone: "text-warning" },
            { label: "Venc. 30 dias", value: num(relatorioClientes.vencendo30), tone: "text-warning" },
            { label: "Novos no período", value: num(relatorioClientes.novosNoPeriodo), tone: "text-success" },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border border-border/50 bg-panel/40 p-3">
              <p className="label-mono">{m.label}</p>
              <p className={`mt-1 font-mono text-xl font-medium ${m.tone}`}>{m.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          Cancelamentos/exclusões: indisponível — depende de Logs/Auditoria (etapa futura).
        </p>
      </section>

      <section
        className="animate-rise grid gap-4 lg:grid-cols-3"
        style={{ animationDelay: "300ms" }}
      >
        <div className="rounded-xl border border-border/60 bg-panel/30 p-4 backdrop-blur-md">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Receita x Custos x Lucro</h2>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGraficoFinanceiro}>
                <XAxis dataKey="nome" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => brl(v)}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {dadosGraficoFinanceiro.map((_, i) => (
                    <Cell key={i} fill={CORES_GRAFICO[i % CORES_GRAFICO.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-panel/30 p-4 backdrop-blur-md">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Receita por servidor</h2>
          <div className="mt-4 h-48">
            {dadosGraficoServidor.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficoServidor}>
                  <XAxis dataKey="nome" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => brl(v)}
                  />
                  <Bar dataKey="Receita" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Lucro" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center font-mono text-[12px] text-muted-foreground">
                Sem receita registrada no período.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-panel/30 p-4 backdrop-blur-md">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Clientes por status</h2>
          <div className="mt-4 flex h-48 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosGraficoStatus.filter((d) => d.valor > 0)}
                  dataKey="valor"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ nome, valor }: { nome: string; valor: number }) => `${nome}: ${valor}`}
                  labelLine={false}
                >
                  {dadosGraficoStatus
                    .filter((d) => d.valor > 0)
                    .map((_, i) => (
                      <Cell key={i} fill={CORES_GRAFICO[i % CORES_GRAFICO.length]} />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section
        className="animate-rise overflow-hidden rounded-xl border border-border/60 bg-panel/30 backdrop-blur-md"
        style={{ animationDelay: "360ms" }}
      >
        <div className="px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Receita por servidor — {pLabel}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              <tr className="border-y border-border/50">
                <th className="px-4 py-2 font-medium">Servidor</th>
                <th className="px-2 py-2 text-right font-medium">Receita</th>
                <th className="px-2 py-2 text-right font-medium">Custo dos créditos</th>
                <th className="px-4 py-2 text-right font-medium">Lucro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {receitaPorServidor.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-foreground/[0.03]">
                  <td className="px-4 py-2.5 text-foreground">{s.nome}</td>
                  <td className="px-2 py-2.5 text-right font-mono text-success">
                    {s.receita > 0 ? brl(s.receita) : "—"}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono text-warning">
                    {s.custo > 0 ? brl(s.custo) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">{brl(s.lucro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="animate-rise overflow-hidden rounded-xl border border-border/60 bg-panel/30 backdrop-blur-md"
        style={{ animationDelay: "420ms" }}
      >
        <div className="px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Receita por aplicativo — {pLabel}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              <tr className="border-y border-border/50">
                <th className="px-4 py-2 font-medium">Aplicativo</th>
                <th className="px-2 py-2 text-right font-medium">Clientes</th>
                <th className="px-4 py-2 text-right font-medium">Receita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {receitaPorAplicativo.map((a) => (
                <tr key={a.aplicativo} className="transition-colors hover:bg-foreground/[0.03]">
                  <td className="px-4 py-2.5 text-foreground">{a.aplicativo}</td>
                  <td className="px-2 py-2.5 text-right font-mono text-muted-foreground">{num(a.clientes)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-success">
                    {a.receita > 0 ? brl(a.receita) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="animate-rise overflow-hidden rounded-xl border border-border/60 bg-panel/30 backdrop-blur-md"
        style={{ animationDelay: "480ms" }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Revendas — {pLabel}</h2>
        </div>
        <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Recargas", value: num(relatorioRevendas.totalRecargas), tone: "text-foreground" },
            { label: "Receita", value: brl(relatorioRevendas.receita), tone: "text-success" },
            { label: "Custo", value: brl(relatorioRevendas.custo), tone: "text-warning" },
            { label: "Lucro", value: brl(relatorioRevendas.lucro), tone: "text-foreground" },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border border-border/50 bg-panel/40 p-3">
              <p className="label-mono">{m.label}</p>
              <p className={`mt-1 font-mono text-xl font-medium ${m.tone}`}>{m.value}</p>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              <tr className="border-y border-border/50">
                <th className="px-4 py-2 font-medium">Revenda</th>
                <th className="px-2 py-2 text-right font-medium">Recargas</th>
                <th className="px-2 py-2 text-right font-medium">Receita</th>
                <th className="px-2 py-2 text-right font-medium">Custo</th>
                <th className="px-4 py-2 text-right font-medium">Lucro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {relatorioRevendas.porRevenda.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-foreground/[0.03]">
                  <td className="px-4 py-2.5 text-foreground">{r.nome}</td>
                  <td className="px-2 py-2.5 text-right font-mono text-muted-foreground">{num(r.recargas)}</td>
                  <td className="px-2 py-2.5 text-right font-mono text-success">
                    {r.receita > 0 ? brl(r.receita) : "—"}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono text-warning">
                    {r.custo > 0 ? brl(r.custo) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">{brl(r.lucro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="animate-rise rounded-xl border border-border/60 bg-panel/30 p-4 backdrop-blur-md"
        style={{ animationDelay: "540ms" }}
      >
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Consolidado financeiro — {pLabel}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-success/20 bg-success/[0.04] p-3">
            <p className="label-mono text-success/70">Receitas</p>
            <div className="mt-2 space-y-1 font-mono text-[12px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pagamentos de clientes</span>
                <span className="text-success">{brl(resumo.recebido)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recargas de revendas</span>
                <span className="text-success">{brl(resumo.receitaRecargas)}</span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-1">
                <span className="text-foreground">Receita total</span>
                <span className="text-success">{brl(resumo.recebido + resumo.receitaRecargas)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-warning/20 bg-warning/[0.04] p-3">
            <p className="label-mono text-warning/70">Custos</p>
            <div className="mt-2 space-y-1 font-mono text-[12px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créditos em renovações</span>
                <span className="text-warning">{brl(resumo.custoCreditos)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custos das recargas</span>
                <span className="text-warning">{brl(resumo.custoRecargas)}</span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-1">
                <span className="text-foreground">Custo total</span>
                <span className="text-warning">{brl(resumo.custoCreditos + resumo.custoRecargas)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-danger/20 bg-danger/[0.04] p-3">
            <p className="label-mono text-danger/70">Despesas</p>
            <div className="mt-2 space-y-1 font-mono text-[12px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Despesas adicionais</span>
                <span className="text-danger">{brl(resumo.totalDespesas)}</span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-1">
                <span className="text-foreground">Despesa total</span>
                <span className="text-danger">{brl(resumo.totalDespesas)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-panel/40 p-3">
            <p className="label-mono">Resultado</p>
            <div className="mt-2 space-y-1 font-mono text-[12px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receita total</span>
                <span className="text-success">{brl(resumo.recebido + resumo.receitaRecargas)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custos + despesas</span>
                <span className="text-warning">
                  {brl(resumo.custoCreditos + resumo.custoRecargas + resumo.totalDespesas)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-1">
                <span className="text-foreground">Lucro estimado</span>
                <span className={resumo.lucroEstimado >= 0 ? "text-success" : "text-danger"}>
                  {brl(resumo.lucroEstimado)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="animate-rise overflow-hidden rounded-xl border border-border/60 bg-panel/30 backdrop-blur-md"
        style={{ animationDelay: "600ms" }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Detalhamento — {pLabel}</h2>
          <span className="label-mono">{lancamentos.length} lançamento(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              <tr className="border-y border-border/50">
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-2 py-2 font-medium">Descrição</th>
                <th className="px-2 py-2 font-medium">Categoria</th>
                <th className="px-2 py-2 text-right font-medium">Receita</th>
                <th className="px-2 py-2 text-right font-medium">Custo</th>
                <th className="px-4 py-2 text-right font-medium">Lucro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {lancamentos.map((l) => (
                <tr key={l.id} className="transition-colors hover:bg-foreground/[0.03]">
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{l.data}</td>
                  <td className="px-2 py-2.5 text-foreground">{l.descricao}</td>
                  <td className="px-2 py-2.5">
                    <span
                      className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${
                        l.categoria === "cliente"
                          ? "bg-foreground/10 text-muted-foreground"
                          : l.categoria === "revenda"
                            ? "bg-success/15 text-success"
                            : "bg-danger/15 text-danger"
                      }`}
                    >
                      {l.categoria === "cliente" ? "Cliente" : l.categoria === "revenda" ? "Revenda" : "Despesa"}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono text-success">
                    {l.receita > 0 ? brl(l.receita) : "—"}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono text-warning">
                    {l.custo > 0 ? brl(l.custo) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">{brl(l.lucro)}</td>
                </tr>
              ))}
              {lancamentos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center font-mono text-[12px] text-muted-foreground">
                    Nenhum lançamento no período selecionado.
                  </td>
                </tr>
              ) : null}
            </tbody>
            {lancamentos.length > 0 ? (
              <tfoot className="border-t-2 border-border/60 font-mono text-[12px]">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-muted-foreground">Totais</td>
                  <td className="px-2 py-3 text-right text-success">
                    {brl(lancamentos.reduce((s, l) => s + l.receita, 0))}
                  </td>
                  <td className="px-2 py-3 text-right text-warning">
                    {brl(lancamentos.reduce((s, l) => s + l.custo, 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">
                    {brl(lancamentos.reduce((s, l) => s + l.lucro, 0))}
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </section>
    </AppShell>
  );
}
