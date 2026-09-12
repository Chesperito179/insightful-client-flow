import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatusDot } from "@/components/StatusDot";
import {
  clienteDe,
  proximasRenovacoes,
  resumoDashboard,
  statusExpiracao,
  ultimosPagamentos,
} from "@/lib/data";
import { brl, dayMonth, num, percent } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Meridian Control" },
      {
        name: "description",
        content:
          "Painel central de controle de clientes: vencimentos, renovações, pagamentos e resultado financeiro em um só lugar.",
      },
      { property: "og:title", content: "Dashboard — Meridian Control" },
      {
        property: "og:description",
        content: "Acompanhe clientes ativos, vencidos, recebimentos e lucro estimado em tempo real.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const r = resumoDashboard();
  const renovacoes = proximasRenovacoes();
  const pagos = ultimosPagamentos();

  const kpis: Array<{
    label: string;
    value: string;
    tone: string;
    hint?: string;
    destaque?: boolean;
    filtro?: "vencidos" | "hoje" | "7dias";
  }> = [
    { label: "Total clientes", value: num(r.total), tone: "text-foreground" },
    { label: "Ativos", value: num(r.ativos), tone: "text-success", hint: percent(r.percentualAtivos) },
    { label: "Vencidos", value: num(r.vencidos), tone: "text-danger", filtro: "vencidos" },
    { label: "Vencem hoje", value: num(r.vencemHoje), tone: "text-foreground", filtro: "hoje" },
    { label: "Próximos 7 dias", value: num(r.vencem7Dias), tone: "text-warning", filtro: "7dias" },
    { label: "Gastos mês", value: brl(r.gastosMes), tone: "text-foreground" },
    { label: "Recebido mês", value: brl(r.recebidoMes), tone: "text-success", destaque: true },
    { label: "Previsto receber", value: brl(r.previstoReceber), tone: "text-foreground" },
    { label: "Lucro estimado", value: brl(r.lucroEstimado), tone: "text-foreground" },
  ];

  return (
    <AppShell titulo="Início" subtitulo="sexta, 12 set 2026 · 14:32" alertas={3}>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {kpis.map((kpi, i) => {
          const classes = `animate-rise block rounded-xl p-4 backdrop-blur-md ${
            kpi.destaque
              ? "border border-success/25 bg-success/[0.06]"
              : "border border-border/60 bg-panel/40"
          } ${kpi.filtro ? "cursor-pointer transition-colors hover:border-foreground/25 hover:bg-panel/60" : ""}`;
          const inner = (
            <>
              <p className={`label-mono ${kpi.destaque ? "text-success/70" : ""}`}>
                {kpi.label}
                {kpi.filtro ? <span className="ml-1 text-faint">→</span> : null}
              </p>
              <p className={`mt-1.5 font-mono text-2xl font-medium ${kpi.tone}`}>{kpi.value}</p>
              {kpi.hint ? <p className="mt-1 font-mono text-[11px] text-muted-foreground">{kpi.hint}</p> : null}
            </>
          );
          return kpi.filtro ? (
            <Link
              key={kpi.label}
              to="/renovacoes"
              search={{ filtro: kpi.filtro }}
              className={classes}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {inner}
            </Link>
          ) : (
            <div key={kpi.label} className={classes} style={{ animationDelay: `${i * 40}ms` }}>
              {inner}
            </div>
          );
        })}
      </section>

      <section className="animate-rise grid gap-3 lg:grid-cols-3" style={{ animationDelay: "360ms" }}>
        <div className="flex items-center gap-3 rounded-xl border border-danger/25 bg-danger/[0.07] p-4 backdrop-blur-md">
          <span className="size-2 shrink-0 rounded-full bg-danger" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{r.vencidos} clientes vencidos</p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {brl(r.valorVencidos)} · ação imediata necessária
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-warning/25 bg-warning/[0.07] p-4 backdrop-blur-md">
          <span className="size-2 shrink-0 rounded-full bg-warning" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {r.vencem7Dias} clientes vencem em 7 dias
            </p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">renovações pendentes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/[0.06] p-4 backdrop-blur-md">
          <span className="size-2 shrink-0 rounded-full bg-success" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {brl(r.previstoReceber)} previstos p/ receber
            </p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">vencimentos do ciclo</p>
          </div>
        </div>
      </section>

      <section className="animate-rise grid gap-4 lg:grid-cols-2" style={{ animationDelay: "420ms" }}>
        <div className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-panel/30 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Próximas renovações</h2>
            <Link to="/renovacoes" className="label-mono transition-colors hover:text-success">
              ver todas
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                <tr className="border-y border-border/50">
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-2 py-2 font-medium">Usuário</th>
                  <th className="px-2 py-2 font-medium">Expiração</th>
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {renovacoes.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-foreground/[0.03]">
                    <td className="px-4 py-2.5">
                      <StatusDot status={statusExpiracao(c.expiracao)} className="mr-2" />
                      <span className="text-foreground">{c.nome}</span>
                    </td>
                    <td className="px-2 py-2.5 font-mono text-muted-foreground">{c.usuario}</td>
                    <td className="px-2 py-2.5 font-mono text-muted-foreground">{dayMonth(c.expiracao)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-foreground">{brl(c.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-panel/30 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Últimos pagamentos</h2>
            <Link to="/pagamentos" className="label-mono transition-colors hover:text-success">
              ver todos
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                <tr className="border-y border-border/50">
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-2 py-2 font-medium">Data</th>
                  <th className="px-2 py-2 font-medium">Valor</th>
                  <th className="px-4 py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {pagos.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-foreground/[0.03]">
                    <td className="px-4 py-2.5 text-foreground">{clienteDe(p.clienteId)?.nome}</td>
                    <td className="px-2 py-2.5 font-mono text-muted-foreground">{dayMonth(p.data)}</td>
                    <td className="px-2 py-2.5 font-mono text-foreground">{brl(p.valor)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${
                          p.status === "pago"
                            ? "bg-success/15 text-success"
                            : "bg-warning/15 text-warning"
                        }`}
                      >
                        {p.status === "pago" ? "Pago" : "Pendente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
