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
import type {
  ConfigMeioPagamento,
  MeioPagamento,
  StatusIntegracao,
  TipoMeioPagamento,
} from "@/lib/meios-pagamento";

interface Props {
  meio: MeioPagamento | null;
  aberto: boolean;
  onFechar: () => void;
}

const campo =
  "w-full rounded-lg border border-border/60 bg-panel/40 px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-faint focus:border-success/40";

const tipos: { value: TipoMeioPagamento; label: string }[] = [
  { value: "pix", label: "PIX" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "transferencia", label: "Transferência" },
  { value: "gateway", label: "Gateway / API" },
];

const statusOpcoes: { value: StatusIntegracao; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "configuracao_pendente", label: "Configuração pendente" },
  { value: "conectado", label: "Conectado" },
  { value: "erro", label: "Erro" },
  { value: "desativado", label: "Desativado" },
];

function configInicial(tipo: TipoMeioPagamento): ConfigMeioPagamento {
  if (tipo === "pix") return { instituicao: "", chavePix: "", tipoChave: "cpf" };
  if (tipo === "transferencia") return { banco: "", agencia: "", conta: "" };
  if (tipo === "gateway") return { endpoint: "", webhookUrl: "" };
  return {};
}

export function MeioPagamentoForm({ meio, aberto, onFechar }: Props) {
  const dados = useAppData();
  const eEdicao = !!meio;

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoMeioPagamento>("pix");
  const [provedor, setProvedor] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [statusIntegracao, setStatusIntegracao] = useState<StatusIntegracao>("manual");
  const [config, setConfig] = useState<ConfigMeioPagamento>({});

  useEffect(() => {
    if (!aberto) return;
    if (meio) {
      setNome(meio.nome);
      setTipo(meio.tipo);
      setProvedor(meio.provedor);
      setAtivo(meio.ativo);
      setStatusIntegracao(meio.statusIntegracao);
      setConfig(meio.configuracoes);
    } else {
      setNome("");
      setTipo("pix");
      setProvedor("");
      setAtivo(true);
      setStatusIntegracao("manual");
      setConfig(configInicial("pix"));
    }
  }, [aberto, meio]);

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { nome, tipo, provedor: provedor || "Manual", ativo, statusIntegracao, configuracoes: config };
    const r = eEdicao
      ? dados.atualizarMeioPagamento(meio!.id, payload)
      : dados.criarMeioPagamento(payload);
    if (!r.ok) {
      toast.error(r.erro ?? "Não foi possível salvar.");
      return;
    }
    toast.success(eEdicao ? "Meio de pagamento atualizado." : "Meio de pagamento cadastrado.");
    onFechar();
  };

  const setCfg = (chave: keyof ConfigMeioPagamento, valor: string) =>
    setConfig((c) => ({ ...c, [chave]: valor }));

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{eEdicao ? "Editar meio de pagamento" : "Novo meio de pagamento"}</DialogTitle>
          <DialogDescription>
            Cadastre os meios pelos quais você recebe pagamentos dos clientes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={salvar} className="grid gap-3">
          <label className="grid gap-1">
            <span className="label-mono">Nome</span>
            <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="label-mono">Tipo</span>
              <select
                className={campo}
                value={tipo}
                onChange={(e) => {
                  const t = e.target.value as TipoMeioPagamento;
                  setTipo(t);
                  setConfig(configInicial(t));
                }}
              >
                {tipos.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label-mono">Provedor</span>
              <input className={campo} value={provedor} onChange={(e) => setProvedor(e.target.value)} placeholder="Ex.: Nubank, Mercado Pago" />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="label-mono">Status da integração</span>
            <select className={campo} value={statusIntegracao} onChange={(e) => setStatusIntegracao(e.target.value as StatusIntegracao)}>
              {statusOpcoes.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>

          {tipo === "pix" && (
            <div className="grid gap-3 rounded-lg border border-border/50 bg-panel/30 p-3">
              <p className="label-mono">Configuração PIX</p>
              <label className="grid gap-1">
                <span className="font-mono text-[11px] text-muted-foreground">Instituição</span>
                <input className={campo} value={config.instituicao ?? ""} onChange={(e) => setCfg("instituicao", e.target.value)} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="font-mono text-[11px] text-muted-foreground">Tipo da chave</span>
                  <select className={campo} value={config.tipoChave ?? "cpf"} onChange={(e) => setCfg("tipoChave", e.target.value)}>
                    <option value="cpf">CPF</option>
                    <option value="email">E-mail</option>
                    <option value="telefone">Telefone</option>
                    <option value="aleatoria">Aleatória</option>
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="font-mono text-[11px] text-muted-foreground">Chave PIX</span>
                  <input className={campo} value={config.chavePix ?? ""} onChange={(e) => setCfg("chavePix", e.target.value)} />
                </label>
              </div>
            </div>
          )}

          {tipo === "transferencia" && (
            <div className="grid gap-3 rounded-lg border border-border/50 bg-panel/30 p-3">
              <p className="label-mono">Dados bancários</p>
              <label className="grid gap-1">
                <span className="font-mono text-[11px] text-muted-foreground">Banco</span>
                <input className={campo} value={config.banco ?? ""} onChange={(e) => setCfg("banco", e.target.value)} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="font-mono text-[11px] text-muted-foreground">Agência</span>
                  <input className={campo} value={config.agencia ?? ""} onChange={(e) => setCfg("agencia", e.target.value)} />
                </label>
                <label className="grid gap-1">
                  <span className="font-mono text-[11px] text-muted-foreground">Conta</span>
                  <input className={campo} value={config.conta ?? ""} onChange={(e) => setCfg("conta", e.target.value)} />
                </label>
              </div>
            </div>
          )}

          {tipo === "gateway" && (
            <div className="grid gap-3 rounded-lg border border-border/50 bg-panel/30 p-3">
              <p className="label-mono">Configuração do gateway</p>
              <label className="grid gap-1">
                <span className="font-mono text-[11px] text-muted-foreground">Endpoint (futuro)</span>
                <input className={campo} value={config.endpoint ?? ""} onChange={(e) => setCfg("endpoint", e.target.value)} placeholder="https://api.provedor.com" />
              </label>
              <label className="grid gap-1">
                <span className="font-mono text-[11px] text-muted-foreground">URL do webhook (futuro)</span>
                <input className={campo} value={config.webhookUrl ?? ""} onChange={(e) => setCfg("webhookUrl", e.target.value)} placeholder="https://seu-sistema.com/webhook" />
              </label>
              <p className="font-mono text-[10px] text-muted-foreground">
                Chaves secretas e credenciais de API serão configuradas em etapa futura.
              </p>
            </div>
          )}

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="size-4 accent-success" />
            <span className="font-mono text-[12px] text-muted-foreground">Ativo (disponível para novas renovações)</span>
          </label>

          <div className="mt-1 flex justify-end gap-2">
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
              {eEdicao ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Retorna a data ISO de hoje (usado em seed). */
export const _hojeSeed = isoHoje;
