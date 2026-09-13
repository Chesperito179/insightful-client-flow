import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isoHoje, mesesEntre, servidorDe, somarMeses, type Cliente } from "@/lib/data";
import { brl, dateBR } from "@/lib/format";
import { useAppData } from "@/lib/store";

const campo =
  "w-full rounded-lg border border-border/60 bg-panel/40 px-3 py-2 text-[13px] text-foreground outline-none focus:border-success/40";

export function RenovarDialog({ cliente, onFechar }: { cliente: Cliente | null; onFechar: () => void }) {
  const dados = useAppData();
  const [meses, setMeses] = useState("1");
  const [valor, setValor] = useState("0");
  const [dataPersonalizada, setDataPersonalizada] = useState("");

  useEffect(() => {
    if (cliente) {
      setMeses("1");
      setValor(String(cliente.valor));
      setDataPersonalizada("");
    }
  }, [cliente]);

  if (!cliente) return null;

  const ePersonalizado = meses === "personalizado";
  const qtdMeses = Number(meses) || 1;
  const valorPago = Number(valor.replace(",", ".")) || 0;
  const servidor = servidorDe(cliente, dados.servidores);
  const custoCredito = servidor.custoCredito;
  const base = cliente.expiracao > isoHoje() ? cliente.expiracao : isoHoje();

  const novaExpiracao = ePersonalizado ? dataPersonalizada : somarMeses(base, qtdMeses);
  const mesesParaCusto = ePersonalizado ? mesesEntre(base, dataPersonalizada) : qtdMeses;
  const custo = custoCredito * mesesParaCusto;
  const lucro = valorPago - custo;

  const qtdCreditos = mesesParaCusto;
  const saldo = dados.saldoServidor(servidor.id);

  const dataInvalida =
    ePersonalizado &&
    (!dataPersonalizada || dataPersonalizada <= cliente.expiracao);

  const podeConfirmar = !ePersonalizado || (!!dataPersonalizada && dataPersonalizada > cliente.expiracao);

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
            <select
              className={campo}
              value={meses}
              onChange={(e) => {
                setMeses(e.target.value);
                if (e.target.value === "personalizado") {
                  setDataPersonalizada(base);
                }
              }}
            >
              {[1, 3, 6, 12].map((m) => (
                <option key={m} value={m}>
                  {m} {m === 1 ? "mês" : "meses"}
                </option>
              ))}
              <option value="personalizado">Personalizado</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="label-mono">Valor recebido (R$)</span>
            <input className={campo} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} />
          </label>
        </div>

        {ePersonalizado && (
          <label className="grid gap-1">
            <span className="label-mono">Nova data de expiração</span>
            <input
              type="date"
              className={campo}
              value={dataPersonalizada}
              onChange={(e) => setDataPersonalizada(e.target.value)}
            />
            <span className="font-mono text-[11px] text-muted-foreground">
              Expiração atual: {dateBR(cliente.expiracao)}
            </span>
            {dataInvalida && (
              <span className="font-mono text-[11px] text-danger">
                A nova data de expiração deve ser posterior à data de expiração atual.
              </span>
            )}
          </label>
        )}

        <dl className="grid gap-1.5 rounded-lg border border-border/60 bg-panel/40 p-3 font-mono text-[12px]">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Nova expiração</dt>
            <dd className="text-foreground">
              {ePersonalizado && !dataPersonalizada ? "—" : dateBR(novaExpiracao)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Custo do crédito</dt>
            <dd className="text-warning">{brl(custo)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Créditos consumidos</dt>
            <dd className="text-muted-foreground">
              {qtdCreditos % 1 === 0 ? qtdCreditos : qtdCreditos.toFixed(2).replace(".", ",")}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Saldo do servidor</dt>
            <dd className={saldo >= qtdCreditos ? "text-success" : "text-danger"}>
              {saldo % 1 === 0 ? saldo : saldo.toFixed(2).replace(".", ",")} crédito(s)
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Lucro estimado</dt>
            <dd className="text-success">{brl(lucro)}</dd>
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
            disabled={!podeConfirmar}
            onClick={() => {
              if (ePersonalizado) {
                if (!dataPersonalizada || dataPersonalizada <= cliente.expiracao) {
                  toast.error("A nova data de expiração deve ser posterior à data de expiração atual.");
                  return;
                }
                const r = dados.renovarCliente(cliente.id, 0, valorPago, dataPersonalizada);
                if (!r.ok) { toast.error(r.erro ?? "Não foi possível renovar."); return; }
                toast.success(`Renovado até ${dateBR(dataPersonalizada)}.`);
              } else {
                const r = dados.renovarCliente(cliente.id, qtdMeses, valorPago);
                if (!r.ok) { toast.error(r.erro ?? "Não foi possível renovar."); return; }
                toast.success(`Renovado até ${dateBR(novaExpiracao)}.`);
              }
              onFechar();
            }}
            className="rounded-lg border border-success/40 bg-success/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-success transition-colors hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmar renovação
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
