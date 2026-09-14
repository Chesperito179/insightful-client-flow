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
import { useAppData } from "@/lib/store";

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

const campo =
  "w-full rounded-lg border border-border/60 bg-panel/40 px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-faint focus:border-success/40";

export function DespesaDialog({ aberto, onFechar }: Props) {
  const dados = useAppData();
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("0");
  const [data, setData] = useState(isoHoje());
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (!aberto) return;
    setDescricao("");
    setValor("0");
    setData(isoHoje());
    setObservacao("");
  }, [aberto]);

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    const r = dados.criarDespesa({
      descricao: descricao.trim(),
      valor: Number(valor.replace(",", ".")) || 0,
      data,
      observacao: observacao.trim(),
    });
    if (!r.ok) {
      toast.error(r.erro ?? "Não foi possível salvar.");
      return;
    }
    toast.success("Despesa registrada.");
    onFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova despesa</DialogTitle>
          <DialogDescription>Despesas adicionais que impactam o lucro do período.</DialogDescription>
        </DialogHeader>
        <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 sm:col-span-2">
            <span className="label-mono">Descrição</span>
            <input
              className={campo}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="grid gap-1">
            <span className="label-mono">Valor (R$)</span>
            <input
              className={campo}
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="label-mono">Data</span>
            <input type="date" className={campo} value={data} onChange={(e) => setData(e.target.value)} required />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="label-mono">Observação</span>
            <textarea
              className={`${campo} min-h-16`}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
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
