import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { brl, dateBR } from "@/lib/format";
import {
  dataHoraBR,
  rotulosAcao,
  rotulosEntidade,
  rotulosOrigem,
  type AlteracaoCampo,
  type LogAuditoria,
} from "@/lib/logs";

const formatar = (v: AlteracaoCampo["de"], formato?: AlteracaoCampo["formato"]) => {
  if (v === null || v === undefined || v === "") return "—";
  if (formato === "moeda" && typeof v === "number") return brl(v);
  if (formato === "data" && typeof v === "string") return dateBR(v);
  if (formato === "booleano" || typeof v === "boolean") return v ? "Sim" : "Não";
  return String(v);
};

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5 text-[13px]">
      <span className="label-mono">{rotulo}</span>
      <span className="break-words text-foreground">{valor}</span>
    </div>
  );
}

export function LogDetalhes({ log, onFechar }: { log: LogAuditoria | null; onFechar: () => void }) {
  if (!log) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rotulosAcao[log.acao]} — {rotulosEntidade[log.entidade]}</DialogTitle>
          <DialogDescription>{log.descricao}</DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-border/40">
          <Linha rotulo="Data/hora" valor={dataHoraBR(log.dataHora)} />
          <Linha rotulo="Usuário" valor={log.usuarioNome} />
          <Linha rotulo="Ação" valor={rotulosAcao[log.acao]} />
          <Linha rotulo="Entidade" valor={rotulosEntidade[log.entidade]} />
          <Linha rotulo="Registro" valor={log.entidadeRotulo ?? "—"} />
          <Linha rotulo="Cliente" valor={log.clienteNome ?? "—"} />
          <Linha rotulo="Origem" valor={rotulosOrigem[log.origem]} />
        </div>

        {log.alteracoes?.length ? (
          <div className="mt-2">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Alterações</h3>
            <div className="overflow-x-auto rounded-lg border border-border/50">
              <table className="w-full text-left text-[13px]">
                <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  <tr className="border-b border-border/50">
                    <th className="px-3 py-2 font-medium">Campo</th>
                    <th className="px-3 py-2 font-medium">Valor anterior</th>
                    <th className="px-3 py-2 font-medium">Novo valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {log.alteracoes.map((a) => (
                    <tr key={a.campo}>
                      <td className="px-3 py-2 text-foreground">{a.rotulo ?? a.campo}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{formatar(a.de, a.formato)}</td>
                      <td className="px-3 py-2 font-mono text-foreground">{formatar(a.para, a.formato)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {log.metadados && Object.keys(log.metadados).length ? (
          <div className="mt-2">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Informações adicionais</h3>
            <div className="divide-y divide-border/40">
              {Object.entries(log.metadados).map(([k, v]) => (
                <Linha key={k} rotulo={k} valor={v === null ? "—" : String(v)} />
              ))}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
