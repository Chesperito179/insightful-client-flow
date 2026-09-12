import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isoHoje, somarMeses, type Cliente } from "@/lib/data";
import { useAppData } from "@/lib/store";

interface Props {
  aberto: boolean;
  cliente: Cliente | null;
  onFechar: () => void;
}

const vazio = (servidorId: string) => ({
  nome: "",
  usuario: "",
  telefone: "",
  valor: "30",
  expiracao: somarMeses(isoHoje(), 1),
  servidorId,
  aplicativo: "",
  observacoes: "",
});

const campo =
  "w-full rounded-lg border border-border/60 bg-panel/40 px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-faint focus:border-success/40";

export function ClienteForm({ aberto, cliente, onFechar }: Props) {
  const dados = useAppData();
  const servidorInicial = dados.servidores[0]?.id ?? "";
  const [form, setForm] = useState(vazio(servidorInicial));

  useEffect(() => {
    if (!aberto) return;
    setForm(
      cliente
        ? {
            nome: cliente.nome,
            usuario: cliente.usuario,
            telefone: cliente.telefone,
            valor: String(cliente.valor),
            expiracao: cliente.expiracao,
            servidorId: cliente.servidorId,
            aplicativo: cliente.aplicativo,
            observacoes: cliente.observacoes,
          }
        : vazio(servidorInicial),
    );
  }, [aberto, cliente, servidorInicial]);

  const set = (k: keyof ReturnType<typeof vazio>, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nome: form.nome,
      usuario: form.usuario,
      telefone: form.telefone,
      valor: Number(form.valor.replace(",", ".")) || 0,
      expiracao: form.expiracao,
      servidorId: form.servidorId,
      aplicativo: form.aplicativo,
      observacoes: form.observacoes,
    };
    const r = cliente ? dados.atualizarCliente(cliente.id, payload) : dados.criarCliente(payload);
    if (!r.ok) {
      toast.error(r.erro ?? "Não foi possível salvar.");
      return;
    }
    toast.success(cliente ? "Cliente atualizado." : "Cliente cadastrado.");
    onFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
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
            <span className="label-mono">Telefone</span>
            <input className={campo} value={form.telefone} onChange={(e) => set("telefone", e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="label-mono">Valor (R$)</span>
            <input
              className={campo}
              inputMode="decimal"
              value={form.valor}
              onChange={(e) => set("valor", e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="label-mono">Data de expiração</span>
            <input
              type="date"
              className={campo}
              value={form.expiracao}
              onChange={(e) => set("expiracao", e.target.value)}
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="label-mono">Servidor</span>
            <select className={campo} value={form.servidorId} onChange={(e) => set("servidorId", e.target.value)}>
              {dados.servidores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="label-mono">Aplicativo</span>
            <input
              className={campo}
              value={form.aplicativo}
              onChange={(e) => set("aplicativo", e.target.value)}
              placeholder="XCLOUD, KPlay…"
            />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="label-mono">Observações</span>
            <textarea
              className={`${campo} min-h-20`}
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              placeholder="Ex.: Smart TV Samsung"
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
