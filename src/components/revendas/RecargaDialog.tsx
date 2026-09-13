import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isoHoje, type Servidor } from "@/lib/data";
import { brl } from "@/lib/format";
import type { Revenda } from "@/lib/revendas";
import { useAppData } from "@/lib/store";

interface Props {
  revenda: Revenda | null;
  onFechar: () => void;
}

const campo =
  "w-full rounded-lg border border-border/60 bg-panel/40 px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-faint focus:border-success/40";

const campoReadOnly =
  "w-full rounded-lg border border-border/40 bg-panel/20 px-3 py-2 text-[13px] text-muted-foreground cursor-not-allowed";

export function RecargaDialog({ revenda, onFechar }: Props) {
  const dados = useAppData();
  const [data, setData] = useState(isoHoje());
  const [servidorId, setServidorId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [valorCobrado, setValorCobrado] = useState("0");
  const [observacoes, setObservacoes] = useState("");

  const servidoresAtivos: Servidor[] = dados.servidores.filter((s) => s.ativo);

  useEffect(() => {
    if (!revenda) return;
    setData(isoHoje());
    setServidorId(servidoresAtivos[0]?.id ?? "");
    setQuantidade("1");
    setValorCobrado("0");
    setObservacoes("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revenda]);

  if (!revenda) return null;

  const servidorSelecionado = servidoresAtivos.find((s) => s.id === servidorId) ?? null;
  const qtd = Number(quantidade.replace(",", ".")) || 0;
  const custoCredito = servidorSelecionado?.custoCredito ?? 0;
  const custoTotal = custoCredito * qtd;
  const valorPago = Number(valorCobrado.replace(",", ".")) || 0;
  const lucro = valorPago - custoTotal;

  const podeRegistrar =
    !!servidorId &&
    !!data &&
    qtd > 0 &&
    valorPago >= 0;

  const registrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!servidorId) {
      toast.error("Selecione um servidor ativo.");
      return;
    }
    if (qtd <= 0) {
      toast.error("A quantidade de créditos deve ser maior que zero.");
      return;
    }
    if (valorPago < 0) {
      toast.error("O valor pago deve ser maior ou igual a zero.");
      return;
    }
    if (!data) {
      toast.error("Informe a data da recarga.");
      return;
    }
    const r = dados.registrarRecarga({
      revendaId: revenda.id,
      data,
      servidorId,
      quantidade: qtd,
      valorCobrado: valorPago,
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
            Selecione o servidor, informe a quantidade e o valor que a revenda vai pagar.
          </DialogDescription>
        </DialogHeader>

        {servidoresAtivos.length === 0 ? (
          <p className="rounded-lg border border-warning/30 bg-warning/[0.07] p-4 text-[13px] text-foreground">
            Não existem servidores ativos cadastrados. Cadastre ou ative um servidor antes de realizar uma recarga.
          </p>
        ) : (
          <form onSubmit={registrar} className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="label-mono">Data</span>
              <input
                type="date"
                className={campo}
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
              />
            </label>
            <label className="grid gap-1">
              <span className="label-mono">Servidor / Painel</span>
              <select
                className={campo}
                value={servidorId}
                onChange={(e) => setServidorId(e.target.value)}
                required
              >
                {servidoresAtivos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
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
            <label className="grid gap-1">
              <span className="label-mono">Custo por crédito</span>
              <input className={campoReadOnly} value={brl(custoCredito)} readOnly />
            </label>
            <label className="grid gap-1 sm:col-span-2">
              <span className="label-mono">Valor que a revenda vai pagar (R$)</span>
              <input
                className={campo}
                inputMode="decimal"
                value={valorCobrado}
                onChange={(e) => setValorCobrado(e.target.value)}
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

            <dl className="grid gap-1.5 rounded-lg border border-border/60 bg-panel/40 p-3 font-mono text-[12px] sm:col-span-2">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Custo total</dt>
                <dd className="text-warning">{brl(custoTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Lucro</dt>
                <dd className="text-success">{brl(lucro)}</dd>
              </div>
            </dl>

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
                disabled={!podeRegistrar}
                className="rounded-lg border border-success/40 bg-success/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-success transition-colors hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Registrar
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
