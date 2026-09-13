import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { EmAndamento } from "@/components/EmAndamento";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { brl } from "@/lib/format";
import { isoHoje } from "@/lib/data";
import { useAppData } from "@/lib/store";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Meridian Control" },
      {
        name: "description",
        content: "Servidores, custos de crédito, aplicativos, valores e usuários do sistema.",
      },
      { property: "og:title", content: "Configurações — Meridian Control" },
      {
        property: "og:description",
        content: "Servidores, custos de crédito, aplicativos, valores e usuários do sistema.",
      },
    ],
  }),
  component: ConfiguracoesPage,
});

const campo =
  "w-full rounded-lg border border-border/60 bg-panel/40 px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-faint focus:border-success/40";

function EntradaCreditosDialog({
  servidorId,
  servidorNome,
  saldoAtual,
  onFechar,
}: {
  servidorId: string | null;
  servidorNome: string;
  saldoAtual: number;
  onFechar: () => void;
}) {
  const dados = useAppData();
  const [quantidade, setQuantidade] = useState("1");
  const [observacoes, setObservacoes] = useState("");

  if (!servidorId) return null;

  const qtd = Number(quantidade.replace(",", ".")) || 0;

  const registrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (qtd <= 0) {
      toast.error("A quantidade deve ser maior que zero.");
      return;
    }
    const r = dados.registrarEntradaCreditos(servidorId, qtd, observacoes);
    if (!r.ok) {
      toast.error(r.erro ?? "Não foi possível registrar.");
      return;
    }
    toast.success(`${qtd} crédito(s) adicionados a ${servidorNome}.`);
    onFechar();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Entrada de créditos — {servidorNome}</DialogTitle>
          <DialogDescription>
            Saldo atual: {saldoAtual} crédito(s). O saldo será aumentado e a movimentação registrada no histórico.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={registrar} className="grid gap-3">
          <label className="grid gap-1">
            <span className="label-mono">Quantidade de créditos</span>
            <input
              className={campo}
              inputMode="numeric"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              autoFocus
            />
          </label>
          <label className="grid gap-1">
            <span className="label-mono">Observações</span>
            <input
              className={campo}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex.: Compra de 30 créditos"
            />
          </label>
          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-lg border border-border/60 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg border border-success/40 bg-success/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-success transition-colors hover:bg-success/20"
            >
              Registrar entrada
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfiguracoesPage() {
  const dados = useAppData();
  const [entradaServidorId, setEntradaServidorId] = useState<string | null>(null);

  const servidorEntrada = entradaServidorId
    ? dados.servidores.find((s) => s.id === entradaServidorId) ?? null
    : null;

  return (
    <AppShell titulo="Configurações" subtitulo="servidores, aplicativos e valores" alertas={3}>
      <section className="animate-rise overflow-hidden rounded-xl border border-border/60 bg-panel/30 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Servidores</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              <tr className="border-y border-border/50">
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-2 py-2 font-medium">Custo do crédito</th>
                <th className="px-2 py-2 font-medium">Saldo</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {dados.servidores.map((s) => {
                const saldo = dados.saldoServidor(s.id);
                return (
                  <tr key={s.id} className="transition-colors hover:bg-foreground/[0.03]">
                    <td className="px-4 py-2.5 text-foreground">{s.nome}</td>
                    <td className="px-2 py-2.5 font-mono text-muted-foreground">{brl(s.custoCredito)}</td>
                    <td className="px-2 py-2.5 font-mono">
                      <span className={saldo > 0 ? "text-success" : saldo < 0 ? "text-danger" : "text-muted-foreground"}>
                        {saldo}
                      </span>
                      <span className="text-faint"> crédito(s)</span>
                    </td>
                    <td className="px-2 py-2.5">
                      <span
                        className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${
                          s.ativo ? "bg-success/15 text-success" : "bg-muted/20 text-muted-foreground"
                        }`}
                      >
                        {s.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setEntradaServidorId(s.id)}
                        className="rounded-md border border-success/40 bg-success/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-success transition-colors hover:bg-success/20"
                      >
                        + Créditos
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <EmAndamento
        etapa="Etapa 7"
        itens={[
          "Aplicativos e valores de planos",
          "Usuários administrativos e ajustes gerais",
        ]}
      />

      <EntradaCreditosDialog
        servidorId={entradaServidorId}
        servidorNome={servidorEntrada?.nome ?? ""}
        saldoAtual={entradaServidorId ? dados.saldoServidor(entradaServidorId) : 0}
        onFechar={() => setEntradaServidorId(null)}
      />
    </AppShell>
  );
}
