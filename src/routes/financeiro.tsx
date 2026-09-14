import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { DespesaDialog } from "@/components/financeiro/DespesaDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { clienteDe, servidorDe, hoje } from "@/lib/data";
import { brl, dateBR, dayMonth } from "@/lib/format";
import { type Periodo, periodoRange, dentroDe, periodoLabel } from "@/lib/periodo";
import { useAppData } from "@/lib/store";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Meridian Control" },
      {
        name: "description",
        content: "Receitas, despesas, custo dos créditos de servidor e cálculo de lucro.",
      },
      { property: "og:title", content: "Financeiro — Meridian Control" },
      {
        property: "og:description",
        content: "Receitas, despesas, custo dos créditos de servidor e cálculo de lucro.",
      },
    ],
  }),
  component: FinanceiroPage,
});

interface Lancamento {
  id: string;
  data: string;
  descricao: string;
  tipo: string;
  receita: number;
  custo: number;
  lucro: number;
  categoria: "cliente" | "revenda" | "despesa";
}

function FinanceiroPage() {
  const dados = useAppData();
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [despesaAberto, setDespesaAberto] = useState(false);
  const [excluindoDespesa, setExcluindoDespesa] = useState<string | null>(null);

  const range = useMemo(() => periodoRange(periodo, hoje), [periodo]);

  const lancamentos = useMemo<Lancamento[]>(() => {
    const itens: Lancamento[] = [];

    for (const p of dados.pagamentos) {
      if (!dentroDe(p.data, range)) continue;
      const cliente = clienteDe(p.clienteId, dados.clientes);
      const servidor = cliente ? servidorDe(cliente, dados.servidores) : null;
      const mov = dados.movimentacoes.find((m) => m.pagamentoId === p.id);
      const creditos = mov?.quantidade ?? 0;
      const custo = servidor ? servidor.custoCredito * creditos : 0;
      itens.push({
        id: p.id,
        data: p.data,
        descricao: cliente?.nome ?? "Cliente removido",
        tipo: `Pagamento · ${p.tipo}`,
        receita: p.status === "pago" ? p.valor : 0,
        custo,
        lucro: p.status === "pago" ? p.valor - custo : 0,
        categoria: "cliente",
      });
    }

    for (const rc of dados.recargas) {
      if (!dentroDe(rc.data, range)) continue;
      const revenda = dados.revendas.find((r) => r.id === rc.revendaId);
      itens.push({
        id: rc.id,
        data: rc.data,
        descricao: `Recarga — ${revenda?.nome ?? "Revenda removida"}`,
        tipo: "Recarga de revenda",
        receita: rc.valorCobrado,
        custo: rc.custoTotal,
        lucro: rc.lucro,
        categoria: "revenda",
      });
    }

    for (const d of dados.despesas) {
      if (!dentroDe(d.data, range)) continue;
      itens.push({
        id: d.id,
        data: d.data,
        descricao: d.descricao,
        tipo: "Despesa",
        receita: 0,
        custo: d.valor,
        lucro: -d.valor,
        categoria: "despesa",
      });
    }

    return itens.sort((a, b) => b.data.localeCompare(a.data));
  }, [dados, range]);

  const resumo = useMemo(() => {
    const pagamentosPeriodo = dados.pagamentos.filter((p) => dentroDe(p.data, range));
    const recebido = pagamentosPeriodo
      .filter((p) => p.status === "pago")
      .reduce((s, p) => s + p.valor, 0);

    const pendente = pagamentosPeriodo
      .filter((p) => p.status === "pendente")
      .reduce((s, p) => s + p.valor, 0);

    const custoCreditosPeriodo = pagamentosPeriodo
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

    const despesasPeriodo = dados.despesas.filter((d) => dentroDe(d.data, range));
    const totalDespesas = despesasPeriodo.reduce((s, d) => s + d.valor, 0);

    const previstoReceber =
      pendente +
      dados.clientes
        .filter((c) => {
          const dias = Math.round(
            (new Date(`${c.expiracao}T12:00:00`).getTime() - range.fim.getTime()) / 86_400_000,
          );
          return dias >= 0 && dias <= 30;
        })
        .reduce((s, c) => s + c.valor, 0);

    const lucroEstimado =
      recebido - custoCreditosPeriodo + lucroRecargas - totalDespesas;

    return {
      recebido,
      pendente,
      previstoReceber,
      custoCreditos: custoCreditosPeriodo,
      receitaRecargas,
      custoRecargas,
      lucroRecargas,
      totalDespesas,
      lucroEstimado,
    };
  }, [dados, range]);

  const pLabel = periodoLabel(periodo);

  const despesaExcluindo = dados.despesas.find((d) => d.id === excluindoDespesa);

  return (
    <AppShell titulo="Financeiro" subtitulo="receitas, despesas e resultado" alertas={3}>
      <section className="flex flex-wrap items-center justify-between gap-2">
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
              {p === "mes" ? "Este mês" : p === "anterior" ? "Mês anterior" : "Últimos 30 dias"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDespesaAberto(true)}
          className="rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-success transition-colors hover:bg-success/20"
        >
          + Nova despesa
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {[
          { label: "Recebido", value: brl(resumo.recebido), tone: "text-success", destaque: true },
          { label: "Previsto receber", value: brl(resumo.previstoReceber), tone: "text-foreground" },
          { label: "Custo créditos", value: brl(resumo.custoCreditos), tone: "text-warning" },
          { label: "Receita recargas", value: brl(resumo.receitaRecargas), tone: "text-success" },
          { label: "Custo recargas", value: brl(resumo.custoRecargas), tone: "text-warning" },
          { label: "Despesas", value: brl(resumo.totalDespesas), tone: "text-danger" },
        ].map((kpi, i) => (
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
        className="animate-rise rounded-xl border border-border/60 bg-panel/40 p-4 backdrop-blur-md"
        style={{ animationDelay: "240ms" }}
      >
        <div className="flex items-center justify-between">
          <p className="label-mono">Lucro estimado — {pLabel}</p>
          <p className="font-mono text-2xl font-medium text-foreground">{brl(resumo.lucroEstimado)}</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(Math.max((resumo.lucroEstimado / Math.max(resumo.recebido + resumo.receitaRecargas, 1)) * 100, 0), 100)}%`,
              backgroundColor: resumo.lucroEstimado >= 0 ? "var(--color-success)" : "var(--color-danger)",
            }}
          />
        </div>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          Receitas de clientes {brl(resumo.recebido)} − custos de créditos {brl(resumo.custoCreditos)} + lucro de recargas {brl(resumo.lucroRecargas)} − despesas {brl(resumo.totalDespesas)}
        </p>
      </section>

      <section
        className="animate-rise overflow-hidden rounded-xl border border-border/60 bg-panel/30 backdrop-blur-md"
        style={{ animationDelay: "300ms" }}
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
                <th className="px-2 py-2 font-medium">Tipo</th>
                <th className="px-2 py-2 text-right font-medium">Receita</th>
                <th className="px-2 py-2 text-right font-medium">Custo</th>
                <th className="px-4 py-2 text-right font-medium">Lucro</th>
                <th className="px-2 py-2 text-center font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {lancamentos.map((l) => (
                <tr key={l.id} className="transition-colors hover:bg-foreground/[0.03]">
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{dayMonth(l.data)}</td>
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
                      {l.tipo}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono text-success">
                    {l.receita > 0 ? brl(l.receita) : "—"}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono text-warning">
                    {l.custo > 0 ? brl(l.custo) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">
                    {l.lucro !== 0 ? brl(l.lucro) : "—"}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    {l.categoria === "despesa" ? (
                      <button
                        type="button"
                        onClick={() => setExcluindoDespesa(l.id)}
                        className="rounded-md px-2 py-0.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                        aria-label="Remover despesa"
                      >
                        ×
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {lancamentos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center font-mono text-[12px] text-muted-foreground">
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
                  <td />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </section>

      <DespesaDialog aberto={despesaAberto} onFechar={() => setDespesaAberto(false)} />

      <AlertDialog
        open={!!excluindoDespesa}
        onOpenChange={(o) => !o && setExcluindoDespesa(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover despesa</AlertDialogTitle>
            <AlertDialogDescription>
              {despesaExcluindo
                ? `"${despesaExcluindo.descricao}" (${brl(despesaExcluindo.valor)} — ${dateBR(despesaExcluindo.data)}) será removida.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!excluindoDespesa) return;
                dados.removerDespesa(excluindoDespesa);
                toast.success("Despesa removida.");
                setExcluindoDespesa(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
