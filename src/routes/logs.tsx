import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LogDetalhes } from "@/components/logs/LogDetalhes";
import {
  dataHoraBR,
  filtrarLogs,
  rotulosAcao,
  rotulosEntidade,
  type AcaoLog,
  type EntidadeLog,
  type LogAuditoria,
} from "@/lib/logs";
import { useAppData } from "@/lib/store";

export const Route = createFileRoute("/logs")({
  head: () => ({
    meta: [
      { title: "Logs e auditoria — Meridian Control" },
      {
        name: "description",
        content:
          "Acompanhe o histórico de ações realizadas no sistema: quem fez, o que mudou, quando e em qual registro.",
      },
      { property: "og:title", content: "Logs e auditoria — Meridian Control" },
      {
        property: "og:description",
        content:
          "Acompanhe o histórico de ações realizadas no sistema: quem fez, o que mudou, quando e em qual registro.",
      },
    ],
  }),
  component: LogsPage,
});

const campo =
  "w-full rounded-lg border border-border/60 bg-panel/40 px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-faint focus:border-success/40";

const POR_PAGINA = 20;

function LogsPage() {
  const dados = useAppData();
  const [termo, setTermo] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [usuario, setUsuario] = useState("todos");
  const [acao, setAcao] = useState<AcaoLog | "todas">("todas");
  const [entidade, setEntidade] = useState<EntidadeLog | "todas">("todas");
  const [clienteId, setClienteId] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [detalhe, setDetalhe] = useState<LogAuditoria | null>(null);

  const filtrados = useMemo(
    () =>
      filtrarLogs(dados.logs, {
        termo,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        usuario,
        acao,
        entidade,
        clienteId,
      }),
    [dados.logs, termo, dataInicio, dataFim, usuario, acao, entidade, clienteId],
  );

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);
  const usuarios = dados.usuariosDosLogs();

  const limpar = () => {
    setTermo("");
    setDataInicio("");
    setDataFim("");
    setUsuario("todos");
    setAcao("todas");
    setEntidade("todas");
    setClienteId("todos");
    setPagina(1);
  };

  return (
    <AppShell
      titulo="Logs e auditoria"
      subtitulo={`${filtrados.length} de ${dados.logs.length} registro(s)`}
    >
      <p className="text-[13px] text-muted-foreground">
        Acompanhe as ações realizadas no sistema: quem executou, qual registro foi afetado, o que
        mudou e de onde veio a ação.
      </p>

      <section className="grid gap-2 rounded-xl border border-border/60 bg-panel/30 p-3 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <input
            value={termo}
            onChange={(e) => {
              setTermo(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por descrição, usuário, registro ou cliente…"
            aria-label="Buscar nos logs"
            className={campo}
          />
        </div>

        <label className="grid gap-1">
          <span className="label-mono">De</span>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => {
              setDataInicio(e.target.value);
              setPagina(1);
            }}
            className={campo}
          />
        </label>
        <label className="grid gap-1">
          <span className="label-mono">Até</span>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => {
              setDataFim(e.target.value);
              setPagina(1);
            }}
            className={campo}
          />
        </label>
        <label className="grid gap-1">
          <span className="label-mono">Usuário</span>
          <select
            value={usuario}
            onChange={(e) => {
              setUsuario(e.target.value);
              setPagina(1);
            }}
            className={campo}
          >
            <option value="todos">Todos</option>
            {usuarios.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="label-mono">Ação</span>
          <select
            value={acao}
            onChange={(e) => {
              setAcao(e.target.value as AcaoLog | "todas");
              setPagina(1);
            }}
            className={campo}
          >
            <option value="todas">Todas</option>
            {(Object.keys(rotulosAcao) as AcaoLog[]).map((a) => (
              <option key={a} value={a}>
                {rotulosAcao[a]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="label-mono">Entidade</span>
          <select
            value={entidade}
            onChange={(e) => {
              setEntidade(e.target.value as EntidadeLog | "todas");
              setPagina(1);
            }}
            className={campo}
          >
            <option value="todas">Todas</option>
            {(Object.keys(rotulosEntidade) as EntidadeLog[]).map((en) => (
              <option key={en} value={en}>
                {rotulosEntidade[en]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="label-mono">Cliente</span>
          <select
            value={clienteId}
            onChange={(e) => {
              setClienteId(e.target.value);
              setPagina(1);
            }}
            className={campo}
          >
            <option value="todos">Todos</option>
            {dados.clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={limpar}
            className="w-full rounded-lg border border-border/60 bg-panel/40 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            Limpar filtros
          </button>
        </div>
      </section>

      <section className="animate-rise overflow-hidden rounded-xl border border-border/60 bg-panel/30 backdrop-blur-md">
        {visiveis.length === 0 ? (
          <div className="grid place-items-center gap-2 px-6 py-14 text-center">
            <div className="grid size-10 place-items-center rounded-lg border border-border/60 bg-panel/50 font-mono text-[13px] text-faint">
              ⎙
            </div>
            <p className="text-[13px] font-medium text-foreground">
              {dados.logs.length === 0 ? "Nenhum registro de auditoria ainda" : "Nenhum registro para estes filtros"}
            </p>
            <p className="max-w-sm text-[12px] text-muted-foreground">
              {dados.logs.length === 0
                ? "As ações realizadas no sistema passarão a aparecer aqui conforme os eventos forem conectados a esta área."
                : "Ajuste o período, o usuário ou os demais filtros para ver outros registros."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                <tr className="border-b border-border/50">
                  <th className="px-4 py-2.5 font-medium">Data/Hora</th>
                  <th className="px-2 py-2.5 font-medium">Usuário</th>
                  <th className="px-2 py-2.5 font-medium">Ação</th>
                  <th className="px-2 py-2.5 font-medium">Entidade</th>
                  <th className="px-2 py-2.5 font-medium">Cliente</th>
                  <th className="px-3 py-2.5 font-medium">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {visiveis.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setDetalhe(l)}
                    className="cursor-pointer transition-colors hover:bg-foreground/[0.03]"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-muted-foreground">
                      {dataHoraBR(l.dataHora)}
                    </td>
                    <td className="px-2 py-2.5 text-foreground">{l.usuarioNome}</td>
                    <td className="px-2 py-2.5 text-muted-foreground">{rotulosAcao[l.acao]}</td>
                    <td className="px-2 py-2.5 text-muted-foreground">
                      {rotulosEntidade[l.entidade]}
                    </td>
                    <td className="px-2 py-2.5 text-muted-foreground">{l.clienteNome ?? "—"}</td>
                    <td className="max-w-[320px] truncate px-3 py-2.5 text-muted-foreground">
                      {l.descricao}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {filtrados.length > 0 && (
        <section className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground">
          <span>
            Página {paginaAtual} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={paginaAtual <= 1}
              onClick={() => setPagina(paginaAtual - 1)}
              className="rounded-lg border border-border/60 bg-panel/40 px-3 py-1.5 uppercase tracking-[0.12em] transition-colors hover:bg-foreground/5 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={paginaAtual >= totalPaginas}
              onClick={() => setPagina(paginaAtual + 1)}
              className="rounded-lg border border-border/60 bg-panel/40 px-3 py-1.5 uppercase tracking-[0.12em] transition-colors hover:bg-foreground/5 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </section>
      )}

      <LogDetalhes log={detalhe} onFechar={() => setDetalhe(null)} />
    </AppShell>
  );
}
