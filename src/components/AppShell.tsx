import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { servidorPadrao, servidores } from "@/lib/data";
import { brl } from "@/lib/format";

const navegacao = [
  { to: "/", label: "Início" },
  { to: "/clientes", label: "Clientes" },
  { to: "/revendas", label: "Revendas" },
  { to: "/financeiro", label: "Financeiro" },
  { to: "/renovacoes", label: "Renovações" },
  { to: "/pagamentos", label: "Pagamentos" },
  { to: "/relatorios", label: "Relatórios" },
  { to: "/configuracoes", label: "Configurações" },
] as const;

interface AppShellProps {
  titulo: string;
  subtitulo: string;
  alertas?: number;
  children: ReactNode;
}

export function AppShell({ titulo, subtitulo, alertas = 0, children }: AppShellProps) {
  const principal = servidores[0] ?? servidorPadrao;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background font-sans text-foreground">
      <div className="ambient-glow pointer-events-none absolute inset-0" />
      <div className="grid-fog pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-border/60 bg-surface/70 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <div className="grid size-8 place-items-center rounded-md bg-success/15 ring-1 ring-success/40">
              <span className="animate-beacon size-2 rounded-full bg-success" />
            </div>
            <div>
              <p className="text-[13px] font-semibold tracking-tight text-foreground">Meridian</p>
              <p className="label-mono mt-0.5">Control</p>
            </div>
          </div>

          <nav className="mt-2 flex-1 space-y-0.5 px-3 text-[13px]">
            {navegacao.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                activeProps={{
                  className:
                    "flex items-center gap-3 rounded-lg bg-foreground/10 px-3 py-2 font-medium text-foreground ring-1 ring-foreground/10",
                }}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`size-1.5 rounded-full ${isActive ? "bg-success" : "bg-faint/40"}`}
                    />
                    {item.label}
                  </>
                )}
              </Link>
            ))}
          </nav>

          <div className="m-3 rounded-xl border border-border/60 bg-panel/50 p-3 backdrop-blur-md">
            <p className="label-mono">{principal.nome} · crédito</p>
            <p className="mt-1 font-mono text-lg font-medium text-foreground">
              {brl(principal.custoCredito)}
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full w-4/5 rounded-full bg-success" />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border/60 bg-background/70 px-4 py-3.5 backdrop-blur-xl sm:px-6">
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                {titulo}
              </h1>
              <p className="truncate font-mono text-[11px] text-faint">{subtitulo}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-lg border border-border/60 bg-panel/50 px-3 py-1.5 font-mono text-[11px] text-muted-foreground backdrop-blur-md md:flex">
                <span className="size-1.5 rounded-full bg-warning" /> alertas ativos
                <span className="rounded bg-danger/15 px-1.5 py-0.5 text-[10px] font-medium text-danger">
                  {alertas}
                </span>
              </div>
              <div className="grid size-8 place-items-center rounded-lg bg-foreground/5 font-mono text-[11px] font-medium text-muted-foreground ring-1 ring-foreground/10">
                AR
              </div>
            </div>
          </header>

          <nav className="flex gap-1 overflow-x-auto border-b border-border/60 bg-surface/50 px-4 py-2 text-[13px] backdrop-blur-xl lg:hidden">
            {navegacao.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="shrink-0 rounded-lg px-3 py-1.5 text-muted-foreground"
                activeProps={{
                  className:
                    "shrink-0 rounded-lg bg-foreground/10 px-3 py-1.5 font-medium text-foreground",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <main className="flex-1 space-y-5 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
