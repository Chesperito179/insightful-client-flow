import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isoHoje, servidorDe, somarMeses, type Cliente } from "@/lib/data";
import { brl, dateBR } from "@/lib/format";
import { useAppData } from "@/lib/store";

const campo =
  "w-full rounded-lg border border-border/60 bg-panel/40 px-3 py-2 text-[13px] text-foreground outline-none focus:border-success/40";

export function RenovarDialog({ cliente, onFechar }: { cliente: Cliente | null; onFechar: () => void }) {
  const dados = useAppData();
  const [meses, setMeses] = useState("1");
  const [valor, setValor] = useState("0");

  useEffect(() => {
    if (cliente) {
      setMeses("1");
      setValor(String(cliente.valor));
    }
  }, [cliente]);

  if (!cliente) return null;

  const qtdMeses = Number(meses) || 1;
  const valorPago = Number(valor.replace(",", ".")) || 0;
  const custo = servidorDe(cliente, dados.servidores).custoCredito * qtdMeses;
  const base = cliente.expiracao > isoHoje() ? cliente.expiracao : isoHoje();
  const novaExpiracao = somarMeses(base, qtdMeses);

  return (
    <Dialog open onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renovar {cliente.nome}</DialogTitle>
          <DialogDescription>
            O pagamento entra no histórico e a data de expiração é atualizada automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="label-mono">Período (meses)</span>
            <select className={campo} value={meses} onChange={(e) => setMeses(e.target.value)}>
              {[1, 3, 6, 12].map((m) => (
                <option key={m} value={m}>
                  {m} {m === 1 ? "mês" : "meses"}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="label-mono">Valor recebido (R$)</span>
            <input className={campo} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} />
          </label>
        </div>

        <dl className="grid gap-1.5 rounded-lg border border-border/60 bg-panel/40 p-3 font-mono text-[12px]">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Nova expiração</dt>
            <dd className="text-foreground">{dateBR(novaExpiracao)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Custo do crédito</dt>
            <dd className="text-warning">{brl(custo)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Lucro estimado</dt>
            <dd className="text-success">{brl(valorPago - custo)}</dd>
          </div>
        </dl>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg border border-border/60 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              dados.renovarCliente(cliente.id, qtdMeses, valorPago);
              toast.success(`Renovado até ${dateBR(novaExpiracao)}.`);
              onFechar();
            }}
            className="rounded-lg border border-success/40 bg-success/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-success transition-colors hover:bg-success/20"
          >
            Confirmar renovação
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
