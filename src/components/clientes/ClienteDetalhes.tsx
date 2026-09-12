import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusDot } from "@/components/StatusDot";
import { diasAteExpirar, servidorDe, statusExpiracao, type Cliente } from "@/lib/data";
import { brl, dateBR } from "@/lib/format";
import { useAppData } from "@/lib/store";

interface Props {
  cliente: Cliente | null;
  onFechar: () => void;
  onEditar: (c: Cliente) => void;
  onRenovar: (c: Cliente) => void;
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/40 py-1.5">
      <dt className="label-mono">{rotulo}</dt>
      <dd className="text-right text-[13px] text-foreground">{valor}</dd>
    </div>
  );
}

export function ClienteDetalhes({ cliente, onFechar, onEditar, onRenovar }: Props) {
  const dados = useAppData();
  if (!cliente) return null;

  const status = statusExpiracao(cliente.expiracao);
  const dias = diasAteExpirar(cliente.expiracao);
  const historico = dados.pagamentosDoCliente(cliente.id);

  return (
    <Dialog open onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StatusDot status={status} />
            {cliente.nome}
          </DialogTitle>
          <DialogDescription>
            {status === "vencido"
              ? `Vencido há ${Math.abs(dias)} dia(s)`
              : dias === 0
                ? "Vence hoje"
                : `Vence em ${dias} dia(s)`}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid gap-0">
          <Linha rotulo="Usuário" valor={cliente.usuario} />
          <Linha rotulo="Telefone" valor={cliente.telefone || "—"} />
          <Linha rotulo="Valor" valor={brl(cliente.valor)} />
          <Linha rotulo="Expiração" valor={dateBR(cliente.expiracao)} />
          <Linha
            rotulo="Último pagamento"
            valor={`${dateBR(cliente.ultimoPagamento)} — ${brl(cliente.valorUltimoPagamento)}`}
          />
          <Linha rotulo="Servidor" valor={servidorDe(cliente, dados.servidores).nome} />
          <Linha rotulo="Aplicativo" valor={cliente.aplicativo || "—"} />
          <Linha rotulo="Custo do crédito" valor={brl(servidorDe(cliente, dados.servidores).custoCredito)} />
        </dl>

        <div>
          <p className="label-mono mb-1">Observações</p>
          <p className="rounded-lg border border-border/60 bg-panel/40 p-3 text-[13px] text-muted-foreground">
            {cliente.observacoes || "Sem observações."}
          </p>
        </div>

        <div>
          <p className="label-mono mb-1">Histórico</p>
          <ul className="rounded-lg border border-border/60 bg-panel/40 divide-y divide-border/40">
            {historico.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-3 py-2 font-mono text-[12px]">
                <span className="text-muted-foreground">{dateBR(p.data)}</span>
                <span className="text-foreground">{brl(p.valor)}</span>
                <span className={p.status === "pago" ? "text-success" : "text-warning"}>
                  {p.tipo} · {p.status === "pago" ? "pago" : "pendente"}
                </span>
              </li>
            ))}
            {historico.length === 0 ? (
              <li className="px-3 py-4 text-center font-mono text-[12px] text-muted-foreground">
                Nenhum pagamento registrado.
              </li>
            ) : null}
          </ul>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onEditar(cliente)}
            className="rounded-lg border border-border/60 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onRenovar(cliente)}
            className="rounded-lg border border-success/40 bg-success/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-success transition-colors hover:bg-success/20"
          >
            Renovar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
