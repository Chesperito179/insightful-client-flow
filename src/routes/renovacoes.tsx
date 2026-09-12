import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatusDot } from "@/components/StatusDot";
import { RenovarDialog } from "@/components/clientes/RenovarDialog";
import { diasAteExpirar, servidorDe, statusExpiracao, type Cliente } from "@/lib/data";
import { brl, dateBR } from "@/lib/format";
import { useAppData } from "@/lib/store";
import { useState } from "react";

type FiltroRenovacao = "todos" | "hoje" | "7dias" | "vencidos";

const filtros: Array<{ id: FiltroRenovacao; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "hoje", label: "Vencem hoje" },
  { id: "7dias", label: "Próximos 7 dias" },
  { id: "vencidos", label: "Vencidos" },
];

const corresponde = (expiracao: string, filtro: FiltroRenovacao) => {
  const dias = diasAteExpirar(expiracao);
  switch (filtro) {
    case "hoje":
      return dias === 0;
    case "7dias":
      return dias >= 0 && dias <= 7;
    case "vencidos":
      return dias < 0;
    default:
      return true;
  }
};

export const Route = createFileRoute("/renovacoes")({
  validateSearch: (search: Record<string, unknown>): { filtro: FiltroRenovacao } => {
    const f = search["filtro"];
    return { filtro: f === "hoje" || f === "7dias" || f === "vencidos" ? f : "todos" };
  },
  head: () => ({
    meta: [
      { title: "Renovações — Meridian Control" },
      {
        name: "description",
        content: "Acompanhamento de vencimentos e renovação de clientes por período.",
      },
      { property: "og:title", content: "Renovações — Meridian Control" },
      {
        property: "og:description",
        content: "Acompanhamento de vencimentos e renovação de clientes por período.",
      },
    ],
  }),
  component: Renovacoes,
});

function Renovacoes() {
  const { filtro } = Route.useSearch();

  const lista = clientes
    .filter((c) => corresponde(c.expiracao, filtro))
    .sort((a, b) => diasAteExpirar(a.expiracao) - diasAteExpirar(b.expiracao));

  const tituloFiltro = filtros.find((f) => f.id === filtro)?.label ?? "Todos";

  return (
    <AppShell titulo="Renovações" subtitulo={`${tituloFiltro.toLowerCase()} · ${lista.length} cliente(s)`} alertas={3}>
      <section className="flex flex-wrap gap-2">
        {filtros.map((f) => (
          <Link
            key={f.id}
            to="/renovacoes"
            search={{ filtro: f.id }}
            className={`rounded-lg border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
              filtro === f.id
                ? "border-success/40 bg-success/10 text-success"
                : "border-border/60 bg-panel/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </section>

      <section className="animate-rise overflow-hidden rounded-xl border border-border/60 bg-panel/30 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              <tr className="border-b border-border/50">
                <th className="px-4 py-2.5 font-medium">Nome</th>
                <th className="px-2 py-2.5 font-medium">Usuário</th>
                <th className="px-2 py-2.5 font-medium">Expiração</th>
                <th className="px-2 py-2.5 font-medium">Servidor</th>
                <th className="px-2 py-2.5 font-medium">Aplicativo</th>
                <th className="px-4 py-2.5 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {lista.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-foreground/[0.03]">
                  <td className="px-4 py-2.5">
                    <StatusDot status={statusExpiracao(c.expiracao)} className="mr-2" />
                    <span className="text-foreground">{c.nome}</span>
                  </td>
                  <td className="px-2 py-2.5 font-mono text-muted-foreground">{c.usuario}</td>
                  <td className="px-2 py-2.5 font-mono text-muted-foreground">{dateBR(c.expiracao)}</td>
                  <td className="px-2 py-2.5 text-muted-foreground">{servidorDe(c).nome}</td>
                  <td className="px-2 py-2.5 text-muted-foreground">{c.aplicativo}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">{brl(c.valor)}</td>
                </tr>
              ))}
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center font-mono text-[12px] text-muted-foreground">
                    Nenhum cliente neste filtro.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
