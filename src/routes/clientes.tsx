import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatusDot } from "@/components/StatusDot";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { ClienteDetalhes } from "@/components/clientes/ClienteDetalhes";
import { RenovarDialog } from "@/components/clientes/RenovarDialog";
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
import { diasAteExpirar, servidorDe, statusExpiracao, type Cliente } from "@/lib/data";
import { brl, dateBR } from "@/lib/format";
import { useAppData } from "@/lib/store";

type Filtro = "todos" | "ativos" | "vencendo" | "vencidos";

const filtros: Array<{ id: Filtro; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "ativos", label: "Ativos" },
  { id: "vencendo", label: "Vencendo" },
  { id: "vencidos", label: "Vencidos" },
];

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Meridian Control" },
      {
        name: "description",
        content: "Cadastro, pesquisa, filtros, detalhes e histórico dos clientes do sistema.",
      },
      { property: "og:title", content: "Clientes — Meridian Control" },
      {
        property: "og:description",
        content: "Cadastro, pesquisa, filtros, detalhes e histórico dos clientes do sistema.",
      },
    ],
  }),
  component: ClientesPage,
});

function ClientesPage() {
  const dados = useAppData();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Cliente | null>(null);
  const [detalhe, setDetalhe] = useState<Cliente | null>(null);
  const [renovando, setRenovando] = useState<Cliente | null>(null);
  const [excluindo, setExcluindo] = useState<Cliente | null>(null);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return dados.clientes
      .filter((c) => {
        const status = statusExpiracao(c.expiracao);
        if (filtro === "ativos" && status !== "ativo") return false;
        if (filtro === "vencendo" && status !== "vencendo") return false;
        if (filtro === "vencidos" && status !== "vencido") return false;
        if (!termo) return true;
        return [c.nome, c.usuario, c.telefone, c.aplicativo, servidorDe(c, dados.servidores).nome]
          .join(" ")
          .toLowerCase()
          .includes(termo);
      })
      .sort((a, b) => diasAteExpirar(a.expiracao) - diasAteExpirar(b.expiracao));
  }, [dados.clientes, dados.servidores, busca, filtro]);

  const clienteAtual = detalhe ? dados.clientes.find((c) => c.id === detalhe.id) ?? null : null;

  return (
    <AppShell titulo="Clientes" subtitulo={`${lista.length} de ${dados.clientes.length} cliente(s)`} alertas={3}>
      <section className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">⌕</span>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente, usuário, telefone…"
            aria-label="Buscar cliente"
            className="w-full rounded-lg border border-border/60 bg-panel/40 py-2 pl-8 pr-3 text-[13px] text-foreground outline-none backdrop-blur-md placeholder:text-faint focus:border-success/40"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filtros.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`rounded-lg border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                filtro === f.id
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-border/60 bg-panel/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setEmEdicao(null);
            setFormAberto(true);
          }}
          className="rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-success transition-colors hover:bg-success/20"
        >
          + Novo cliente
        </button>
      </section>

      <section className="animate-rise overflow-hidden rounded-xl border border-border/60 bg-panel/30 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              <tr className="border-b border-border/50">
                <th className="px-4 py-2.5 font-medium">Nome</th>
                <th className="px-2 py-2.5 font-medium">Usuário</th>
                <th className="px-2 py-2.5 font-medium">Expiração</th>
                <th className="px-2 py-2.5 font-medium">Último pagamento / valor</th>
                <th className="px-2 py-2.5 font-medium">Servidor</th>
                <th className="px-2 py-2.5 font-medium">Aplicativo</th>
                <th className="px-3 py-2.5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {lista.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setDetalhe(c)}
                  className="cursor-pointer transition-colors hover:bg-foreground/[0.03]"
                >
                  <td className="px-4 py-2.5">
                    <StatusDot status={statusExpiracao(c.expiracao)} className="mr-2" />
                    <span className="text-foreground">{c.nome}</span>
                  </td>
                  <td className="px-2 py-2.5 font-mono text-muted-foreground">{c.usuario}</td>
                  <td className="px-2 py-2.5 font-mono text-muted-foreground">{dateBR(c.expiracao)}</td>
                  <td className="px-2 py-2.5 font-mono text-muted-foreground">
                    {dateBR(c.ultimoPagamento)} — {brl(c.valorUltimoPagamento)}
                  </td>
                  <td className="px-2 py-2.5 text-muted-foreground">{servidorDe(c, dados.servidores).nome}</td>
                  <td className="px-2 py-2.5 text-muted-foreground">{c.aplicativo}</td>
                  <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Ações de ${c.nome}`}
                        className="rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                      >
                        ⋮
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onSelect={() => setDetalhe(c)}>Visualizar</DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            setEmEdicao(c);
                            setFormAberto(true);
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setRenovando(c)}>Renovar</DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setExcluindo(c)}
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
                  <td colSpan={7} className="px-4 py-10 text-center font-mono text-[12px] text-muted-foreground">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <ClienteForm
        aberto={formAberto}
        cliente={emEdicao}
        onFechar={() => setFormAberto(false)}
      />

      <ClienteDetalhes
        cliente={clienteAtual}
        onFechar={() => setDetalhe(null)}
        onEditar={(c) => {
          setDetalhe(null);
          setEmEdicao(c);
          setFormAberto(true);
        }}
        onRenovar={(c) => {
          setDetalhe(null);
          setRenovando(c);
        }}
      />

      <RenovarDialog cliente={renovando} onFechar={() => setRenovando(null)} />

      <AlertDialog open={!!excluindo} onOpenChange={(o) => !o && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              {excluindo
                ? `"${excluindo.nome}" e todo o histórico de pagamentos dele serão removidos. Esta ação não pode ser desfeita.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!excluindo) return;
                dados.removerCliente(excluindo.id);
                toast.success(`${excluindo.nome} foi excluído.`);
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
