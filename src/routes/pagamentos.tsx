import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { EmAndamento } from "@/components/EmAndamento";
import { MeioPagamentoDetalhes } from "@/components/pagamentos/MeioPagamentoDetalhes";
import { MeioPagamentoForm } from "@/components/pagamentos/MeioPagamentoForm";
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
import { dayMonth } from "@/lib/format";
import type { MeioPagamento, StatusIntegracao, TipoMeioPagamento } from "@/lib/meios-pagamento";
import { useAppData } from "@/lib/store";

export const Route = createFileRoute("/pagamentos")({
  head: () => ({
    meta: [
      { title: "Pagamentos — Meridian Control" },
      {
        name: "description",
        content: "Meios de recebimento e estrutura de pagamentos e integrações.",
      },
      { property: "og:title", content: "Pagamentos — Meridian Control" },
      {
        property: "og:description",
        content: "Meios de recebimento e estrutura de pagamentos e integrações.",
      },
    ],
  }),
  component: PagamentosPage,
});

const tipoLabel: Record<TipoMeioPagamento, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
  gateway: "Gateway / API",
};

const statusLabel: Record<StatusIntegracao, string> = {
  manual: "Manual",
  configuracao_pendente: "Configuração pendente",
  conectado: "Conectado",
  erro: "Erro",
  desativado: "Desativado",
};

const statusTone: Record<StatusIntegracao, string> = {
  manual: "bg-foreground/10 text-muted-foreground",
  configuracao_pendente: "bg-warning/15 text-warning",
  conectado: "bg-success/15 text-success",
  erro: "bg-danger/15 text-danger",
  desativado: "bg-muted/20 text-muted-foreground",
};

function PagamentosPage() {
  const dados = useAppData();
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<MeioPagamento | null>(null);
  const [excluindo, setExcluindo] = useState<MeioPagamento | null>(null);
  const [visualizando, setVisualizando] = useState<MeioPagamento | null>(null);

  const abrirNovo = () => {
    setEditando(null);
    setFormAberto(true);
  };

  const abrirEdicao = (m: MeioPagamento) => {
    setEditando(m);
    setFormAberto(true);
  };

  const confirmarExclusao = () => {
    if (!excluindo) return;
    const r = dados.removerMeioPagamento(excluindo.id);
    if (!r.ok) {
      toast.error(r.erro ?? "Não foi possível excluir.");
    } else {
      toast.success("Meio de pagamento removido.");
    }
    setExcluindo(null);
  };

  const totalAtivos = dados.meiosPagamento.filter((m) => m.ativo).length;
  const totalGateway = dados.meiosPagamento.filter((m) => m.tipo === "gateway").length;

  return (
    <AppShell titulo="Pagamentos" subtitulo="meios de recebimento e integrações" alertas={3}>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Meios cadastrados", value: dados.meiosPagamento.length, tone: "text-foreground" },
          { label: "Ativos", value: totalAtivos, tone: "text-success", destaque: true },
          { label: "Gateways / API", value: totalGateway, tone: "text-warning" },
          {
            label: "Integrações conectadas",
            value: dados.meiosPagamento.filter((m) => m.statusIntegracao === "conectado").length,
            tone: "text-foreground",
          },
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
        className="animate-rise overflow-hidden rounded-xl border border-border/60 bg-panel/30 backdrop-blur-md"
        style={{ animationDelay: "160ms" }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Meios de recebimento</h2>
          <button
            type="button"
            onClick={abrirNovo}
            className="rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-success transition-colors hover:bg-success/20"
          >
            + Adicionar meio de pagamento
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              <tr className="border-y border-border/50">
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-2 py-2 font-medium">Tipo</th>
                <th className="px-2 py-2 font-medium">Provedor</th>
                <th className="px-2 py-2 font-medium">Integração</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Atualizado</th>
                <th className="px-4 py-2 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {dados.meiosPagamento.map((m) => {
                const vinculados = dados.pagamentosDoMeio(m.id).length;
                return (
                <tr key={m.id} className="transition-colors hover:bg-foreground/[0.03]">
                  <td className="px-4 py-2.5 text-foreground">{m.nome}</td>
                  <td className="px-2 py-2.5 font-mono text-muted-foreground">{tipoLabel[m.tipo]}</td>
                  <td className="px-2 py-2.5 font-mono text-muted-foreground">{m.provedor}</td>
                  <td className="px-2 py-2.5">
                    <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${statusTone[m.statusIntegracao]}`}>
                      {statusLabel[m.statusIntegracao]}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <span
                      className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${
                        m.ativo ? "bg-success/15 text-success" : "bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      {m.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 font-mono text-[11px] text-muted-foreground">{dayMonth(m.atualizadoEm)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setVisualizando(m)}
                        className="rounded-md px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                      >
                        Visualizar
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirEdicao(m)}
                        className="rounded-md px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => dados.toggleMeioPagamento(m.id)}
                        className="rounded-md px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-warning/10 hover:text-warning"
                      >
                        {m.ativo ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExcluindo(m)}
                        disabled={vinculados > 0}
                        title={
                          vinculados > 0
                            ? "Possui pagamentos vinculados e não pode ser excluído."
                            : undefined
                        }
                        className="rounded-md px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {dados.meiosPagamento.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center font-mono text-[12px] text-muted-foreground">
                    Nenhum meio de pagamento cadastrado. Clique em "Adicionar" para começar.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="animate-rise rounded-xl border border-border/60 bg-panel/30 p-4 backdrop-blur-md"
        style={{ animationDelay: "220ms" }}
      >
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Integrações</h2>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          Provedores que poderão ser conectados futuramente para recebimento automático via API.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { nome: "Mercado Pago", tipo: "Gateway" },
            { nome: "PagBank", tipo: "Gateway" },
            { nome: "Asaas", tipo: "Gateway" },
            { nome: "Stripe", tipo: "Gateway" },
          ].map((p) => (
            <div key={p.nome} className="rounded-lg border border-border/50 bg-panel/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium text-foreground">{p.nome}</p>
                <span className="rounded-md bg-warning/15 px-2 py-0.5 font-mono text-[10px] text-warning">
                  Futuro
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">{p.tipo}</p>
              <p className="mt-2 font-mono text-[10px] text-faint">
                Configuração de API disponível em etapa futura.
              </p>
            </div>
          ))}
        </div>
      </section>

      <EmAndamento
        etapa="Próximas etapas"
        itens={[
          "Histórico de pagamentos por meio de recebimento",
          "Conexão com gateways de pagamento via API",
          "Recebimento automático via webhook",
        ]}
      />

      <MeioPagamentoForm meio={editando} aberto={formAberto} onFechar={() => setFormAberto(false)} />

      <MeioPagamentoDetalhes
        meio={visualizando}
        aberto={!!visualizando}
        onFechar={() => setVisualizando(null)}
      />

      <AlertDialog open={!!excluindo} onOpenChange={(o) => !o && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meio de pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              {excluindo
                ? `"${excluindo.nome}" será removido. Pagamentos que utilizaram este meio continuarão preservados no histórico.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
