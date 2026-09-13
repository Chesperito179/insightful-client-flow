import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isoHoje } from "@/lib/data";
import type { Revenda } from "@/lib/revendas";
import { useAppData } from "@/lib/store";

interface Props {
  revenda: Revenda | null;
  onFechar: () => void;
}

const campo =
  "w-full rounded-lg border border-border/60 bg-panel/40 px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-faint focus:border-success/40";

export function RecargaDialog({ revenda, onFechar }: Props) {
  const dados = useAppData();
  const [data, setData] = useState(isoHoje());
  const [quantidade, setQuantidade] = useState("1");
  const [valorCredito, setValorCredito] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (!revenda) return;
    setData(isoHoje());
    setQuantidade("1");
    setValorCredito(String(revenda.valorCredito));
    setObservacoes("");
  }, [revenda]);

  if (!revenda) return null;

  const registrar = (e: React.FormEvent) => {
    e.preventDefault();
    const r = dados.registrarRecarga({
      revendaId: revenda.id,
      data,
      quantidade: Number(quantidade.replace(",", ".")) || 0,
      valorCredito: Number(valorCredito.replace(",", ".")) || 0,
      observacoes,
    });
    if (!r.ok) {
      toast.error(r.erro ?? "Não foi possível registrar a recarga.");
      return;
    }
    toast.success("Recarga registrada.");
    onFechar();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recarga — {revenda.nome}</DialogTitle>
          <DialogDescription>
            Registro da recarga no histórico da revenda. A integração com o Financeiro será definida depois.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={registrar} className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="label-mono">Data</span>
            <input type="date" className={campo} value={data} onChange={(e) => setData(e.target.value)} required />
          </label>
          <label className="grid gap-1">
            <span className="label-mono">Quantidade de créditos</span>
            <input
              className={campo}
              inputMode="numeric"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="label-mono">Valor de compra do crédito (R$)</span>
            <input
              className={campo}
              inputMode="decimal"
              value={valorCredito}
              onChange={(e) => setValorCredito(e.target.value)}
            />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="label-mono">Observações</span>
            <textarea
              className={`${campo} min-h-16`}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </label>

          <div className="mt-1 flex justify-end gap-2 sm:col-span-2">
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
              Registrar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
