import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { brl, dateBR } from "@/lib/format";
import type { MeioPagamento, StatusIntegracao, TipoMeioPagamento } from "@/lib/meios-pagamento";
import { useAppData } from "@/lib/store";

interface Props {
  meio: MeioPagamento | null;
  aberto: boolean;
  onFechar: () => void;
}

const tipoLabel: Record<TipoMeioPagamento, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
  gateway: "Gateway / API",
};

const statusLabel: Record<StatusIntegracao, string> = {
  manual: "Manual",
  configuracao_pendente: "Configuração pendente",
  conectado: "Conectado",
  erro: "Erro",
  desativado: "Desativado",
};

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="grid gap-0.5">
      <span className="label-mono">{rotulo}</span>
      <span className="text-[13px] text-foreground">{valor || "—"}</span>
    </div>
  );
}

export function MeioPagamentoDetalhes({ meio, aberto, onFechar }: Props) {
  const dados = useAppData();
  if (!meio) return null;

  const pagamentos = dados.pagamentosDoMeio(meio.id);
  const total = pagamentos.reduce((s, p) => s + p.valor, 0);
  const cfg = meio.configuracoes ?? {};

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{meio.nome}</DialogTitle>
          <DialogDescription>Informações cadastradas e pagamentos vinculados.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Linha rotulo="Tipo" valor={tipoLabel[meio.tipo]} />
          <Linha rotulo="Provedor / instituição" valor={meio.provedor} />
          <Linha rotulo="Status" valor={meio.ativo ? "Ativo" : "Inativo"} />
          <Linha rotulo="Integração" valor={statusLabel[meio.statusIntegracao]} />
          <Linha rotulo="Cadastrado em" valor={meio.criadoEm ? dateBR(meio.criadoEm) : "—"} />
          <Linha rotulo="Atualizado em" valor={meio.atualizadoEm ? dateBR(meio.atualizadoEm) : "—"} />
        </div>

        {meio.tipo === "pix" ? (
          <div className="grid gap-3 rounded-lg border border-border/50 bg-panel/30 p-3 sm:grid-cols-2">
            <Linha rotulo="Instituição" valor={cfg.instituicao ?? ""} />
            <Linha rotulo="Tipo da chave" valor={cfg.tipoChave ?? ""} />
            <Linha rotulo="Chave PIX" valor={cfg.chavePix ?? ""} />
          </div>
        ) : null}

        {meio.tipo === "transferencia" ? (
          <div className="grid gap-3 rounded-lg border border-border/50 bg-panel/30 p-3 sm:grid-cols-2">
            <Linha rotulo="Banco" valor={cfg.banco ?? ""} />
            <Linha rotulo="Agência" valor={cfg.agencia ?? ""} />
            <Linha rotulo="Conta" valor={cfg.conta ?? ""} />
          </div>
        ) : null}

        {meio.tipo === "gateway" ? (
          <div className="grid gap-3 rounded-lg border border-border/50 bg-panel/30 p-3">
            <Linha rotulo="Endpoint" valor={cfg.endpoint ?? ""} />
            <Linha rotulo="URL do webhook" valor={cfg.webhookUrl ?? ""} />
            <p className="font-mono text-[10px] text-faint">
              Credenciais e chaves de API serão configuradas em etapa futura.
            </p>
          </div>
        ) : null}

        <div className="grid gap-2 rounded-lg border border-border/50 bg-panel/30 p-3">
          <div className="flex items-center justify-between">
            <p className="label-mono">Pagamentos recebidos por este meio</p>
            <p className="font-mono text-[12px] text-success">{brl(total)}</p>
          </div>
          {pagamentos.length === 0 ? (
            <p className="font-mono text-[11px] text-muted-foreground">
              Nenhum pagamento vinculado a este meio até o momento.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  <tr className="border-b border-border/50">
                    <th className="py-1.5 font-medium">Data</th>
                    <th className="py-1.5 font-medium">Cliente</th>
                    <th className="py-1.5 font-medium">Tipo</th>
                    <th className="py-1.5 font-medium">Origem</th>
                    <th className="py-1.5 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {pagamentos.slice(0, 10).map((p) => (
                    <tr key={p.id}>
                      <td className="py-1.5 font-mono text-muted-foreground">{dateBR(p.data)}</td>
                      <td className="py-1.5 text-foreground">
                        {dados.clientes.find((c) => c.id === p.clienteId)?.nome ?? "—"}
                      </td>
                      <td className="py-1.5 font-mono text-muted-foreground">{p.tipo}</td>
                      <td className="py-1.5 font-mono text-muted-foreground">{p.origem ?? "manual"}</td>
                      <td className="py-1.5 text-right font-mono text-foreground">{brl(p.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pagamentos.length > 10 ? (
                <p className="mt-2 font-mono text-[10px] text-faint">
                  Exibindo os 10 mais recentes de {pagamentos.length}.
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg border border-border/60 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Fechar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
