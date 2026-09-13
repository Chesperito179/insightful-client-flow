import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { brl, dateBR } from "@/lib/format";
import type { Revenda } from "@/lib/revendas";
import { useAppData } from "@/lib/store";

interface Props {
  revenda: Revenda | null;
  onFechar: () => void;
  onEditar: (r: Revenda) => void;
  onRecarga: (r: Revenda) => void;
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/40 py-1.5">
      <dt className="label-mono">{rotulo}</dt>
      <dd className="text-right text-[13px] text-foreground">{valor}</dd>
    </div>
  );
}

export function RevendaDetalhes({ revenda, onFechar, onEditar, onRecarga }: Props) {
  const dados = useAppData();
  if (!revenda) return null;

  const historico = dados.recargasDaRevenda(revenda.id);

  return (
    <Dialog open onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{revenda.nome}</DialogTitle>
          <DialogDescription>{revenda.painel || "Painel não informado"}</DialogDescription>
        </DialogHeader>

        <dl className="grid gap-0">
          <Linha rotulo="Usuário" valor={revenda.usuario} />
          <Linha rotulo="Painel" valor={revenda.painel || "—"} />
          <Linha rotulo="Valor de compra dos créditos" valor={brl(revenda.valorCredito)} />
          <Linha rotulo="Última recarga" valor={revenda.ultimaRecarga ? dateBR(revenda.ultimaRecarga) : "—"} />
        </dl>

        <div>
          <p className="label-mono mb-1">Observações</p>
          <p className="rounded-lg border border-border/60 bg-panel/40 p-3 text-[13px] text-muted-foreground">
            {revenda.observacoes || "Sem observações."}
          </p>
        </div>

        <div>
          <p className="label-mono mb-1">Histórico de recargas</p>
          <ul className="divide-y divide-border/40 rounded-lg border border-border/60 bg-panel/40">
            {historico.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-3 py-2 font-mono text-[12px]">
                <span className="text-muted-foreground">{dateBR(r.data)}</span>
                <span className="text-foreground">{r.quantidade} crédito(s)</span>
                <span className="text-muted-foreground">{brl(r.valorCredito)}</span>
              </li>
            ))}
            {historico.length === 0 ? (
              <li className="px-3 py-4 text-center font-mono text-[12px] text-muted-foreground">
                Nenhuma recarga registrada.
              </li>
            ) : null}
          </ul>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onEditar(revenda)}
            className="rounded-lg border border-border/60 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onRecarga(revenda)}
            className="rounded-lg border border-success/40 bg-success/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-success transition-colors hover:bg-success/20"
          >
            Recarga
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
