import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Revenda } from "@/lib/revendas";
import { useAppData } from "@/lib/store";

interface Props {
  aberto: boolean;
  revenda: Revenda | null;
  onFechar: () => void;
}

const vazio = () => ({ nome: "", usuario: "", painel: "", valorCredito: "8", observacoes: "" });

const campo =
  "w-full rounded-lg border border-border/60 bg-panel/40 px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-faint focus:border-success/40";

export function RevendaForm({ aberto, revenda, onFechar }: Props) {
  const dados = useAppData();
  const [form, setForm] = useState(vazio());

  useEffect(() => {
    if (!aberto) return;
    setForm(
      revenda
        ? {
            nome: revenda.nome,
            usuario: revenda.usuario,
            painel: revenda.painel,
            valorCredito: String(revenda.valorCredito),
            observacoes: revenda.observacoes,
          }
        : vazio(),
    );
  }, [aberto, revenda]);

  const set = (k: keyof ReturnType<typeof vazio>, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nome: form.nome,
      usuario: form.usuario,
      painel: form.painel,
      valorCredito: Number(form.valorCredito.replace(",", ".")) || 0,
      observacoes: form.observacoes,
    };
    const r = revenda ? dados.atualizarRevenda(revenda.id, payload) : dados.criarRevenda(payload);
    if (!r.ok) {
      toast.error(r.erro ?? "Não foi possível salvar.");
      return;
    }
    toast.success(revenda ? "Revenda atualizada." : "Revenda cadastrada.");
    onFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{revenda ? "Editar revenda" : "Nova revenda"}</DialogTitle>
          <DialogDescription>
            O usuário precisa ser único — cadastros duplicados são bloqueados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 sm:col-span-2">
            <span className="label-mono">Nome</span>
            <input className={campo} value={form.nome} onChange={(e) => set("nome", e.target.value)} required />
          </label>
          <label className="grid gap-1">
            <span className="label-mono">Usuário</span>
            <input className={campo} value={form.usuario} onChange={(e) => set("usuario", e.target.value)} required />
          </label>
          <label className="grid gap-1">
            <span className="label-mono">Painel</span>
            <input
              className={campo}
              value={form.painel}
              onChange={(e) => set("painel", e.target.value)}
              placeholder="Nome do painel"
            />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="label-mono">Valor de compra do crédito (R$)</span>
            <input
              className={campo}
              inputMode="decimal"
              value={form.valorCredito}
              onChange={(e) => set("valorCredito", e.target.value)}
            />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="label-mono">Observações</span>
            <textarea
              className={`${campo} min-h-20`}
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
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
              Salvar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
