import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RevendaForm } from "@/components/revendas/RevendaForm";
import { RevendaDetalhes } from "@/components/revendas/RevendaDetalhes";
import { RecargaDialog } from "@/components/revendas/RecargaDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { brl, dateBR } from "@/lib/format";
import type { Revenda } from "@/lib/revendas";
import { useAppData } from "@/lib/store";

export const Route = createFileRoute("/revendas")({
  head: () => ({
    meta: [
      { title: "Revendas — Meridian Control" },
      {
        name: "description",
        content: "Cadastro e acompanhamento das revendas, painéis, recargas e valor de compra do crédito.",
      },
      { property: "og:title", content: "Revendas — Meridian Control" },
      {
        property: "og:description",
        content: "Cadastro e acompanhamento das revendas, painéis, recargas e valor de compra do crédito.",
      },
    ],
  }),
  component: RevendasPage,
});

function RevendasPage() {
  const dados = useAppData();
  const [busca, setBusca] = useState("");
  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Revenda | null>(null);
  const [detalhe, setDetalhe] = useState<Revenda | null>(null);
  const [recarregando, setRecarregando] = useState<Revenda | null>(null);
  const [excluindo, setExcluindo] = useState<Revenda | null>(null);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return dados.revendas.filter((r) =>
      termo ? [r.nome, r.usuario, r.painel].join(" ").toLowerCase().includes(termo) : true,
    );
  }, [dados.revendas, busca]);

  const revendaAtual = detalhe ? dados.revendas.find((r) => r.id === detalhe.id) ?? null : null;

  return (
    <AppShell titulo="Revendas" subtitulo={`${lista.length} de ${dados.revendas.length} revenda(s)`}>
      <p className="text-[13px] text-muted-foreground">
        Gerencie suas revendas, painéis, valor de compra do crédito e o histórico de recargas.
      </p>

      <section className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:min-w-[200px] sm:flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">⌕</span>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar revenda, usuário, painel…"
            aria-label="Buscar revenda"
            className="w-full rounded-lg border border-border/60 bg-panel/40 py-2 pl-8 pr-3 text-[13px] text-foreground outline-none backdrop-blur-md placeholder:text-faint focus:border-success/40"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setEmEdicao(null);
            setFormAberto(true);
          }}
          className="rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-success transition-colors hover:bg-success/20"
        >
          + Nova revenda
        </button>
      </section>

      <section className="animate-rise overflow-hidden rounded-xl border border-border/60 bg-panel/30 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              <tr className="border-b border-border/50">
                <th className="px-4 py-2.5 font-medium">Nome</th>
                <th className="px-2 py-2.5 font-medium">Usuário</th>
                <th className="px-2 py-2.5 font-medium">Painel</th>
                <th className="px-2 py-2.5 font-medium">Última recarga</th>
                <th className="px-2 py-2.5 font-medium">Valor de compra do crédito</th>
                <th className="px-3 py-2.5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {lista.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setDetalhe(r)}
                  className="cursor-pointer transition-colors hover:bg-foreground/[0.03]"
                >
                  <td className="px-4 py-2.5 text-foreground">{r.nome}</td>
                  <td className="px-2 py-2.5 font-mono text-muted-foreground">{r.usuario}</td>
                  <td className="px-2 py-2.5 text-muted-foreground">{r.painel || "—"}</td>
                  <td className="px-2 py-2.5 font-mono text-muted-foreground">
                    {r.ultimaRecarga ? dateBR(r.ultimaRecarga) : "—"}
                  </td>
                  <td className="px-2 py-2.5 font-mono text-muted-foreground">{brl(r.valorCredito)}</td>
                  <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Ações de ${r.nome}`}
                        className="rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/20"
                      >
                        ⋮
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onSelect={() => setDetalhe(r)}>Visualizar</DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            setEmEdicao(r);
                            setFormAberto(true);
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setRecarregando(r)}>Recarga</DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setExcluindo(r)}
                          className="text-danger focus:text-danger"
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center font-mono text-[12px] text-muted-foreground">
                    Nenhuma revenda encontrada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <RevendaForm aberto={formAberto} revenda={emEdicao} onFechar={() => setFormAberto(false)} />

      <RevendaDetalhes
        revenda={revendaAtual}
        onFechar={() => setDetalhe(null)}
        onEditar={(r) => {
          setDetalhe(null);
          setEmEdicao(r);
          setFormAberto(true);
        }}
        onRecarga={(r) => {
          setDetalhe(null);
          setRecarregando(r);
        }}
      />

      <RecargaDialog revenda={recarregando} onFechar={() => setRecarregando(null)} />

      <AlertDialog open={!!excluindo} onOpenChange={(o) => !o && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir revenda</AlertDialogTitle>
            <AlertDialogDescription>
              {excluindo
                ? `"${excluindo.nome}" e o histórico de recargas dela serão removidos. Esta ação não pode ser desfeita.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!excluindo) return;
                dados.removerRevenda(excluindo.id);
                toast.success(`${excluindo.nome} foi excluída.`);
                setExcluindo(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
