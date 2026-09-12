import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmAndamento } from "@/components/EmAndamento";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Meridian Control" },
      {
        name: "description",
        content: "Cadastro, pesquisa, filtros, detalhes e histórico dos clientes do sistema.",
      },
      { property: "og:title", content: "Clientes — Meridian Control" },
      {
        property: "og:description",
        content: "Cadastro, pesquisa, filtros, detalhes e histórico dos clientes do sistema.",
      },
    ],
  }),
  component: () => (
    <AppShell titulo="Clientes" subtitulo="cadastro e gestão da base" alertas={3}>
      <EmAndamento
        etapa="Etapa 2"
        itens={[
          "Tabela com Nome, Usuário, Expiração, Último pagamento/Valor, Servidor e Aplicativo",
          "Barra de pesquisa e filtros: Todos, Ativos, Vencendo, Vencidos",
          "Detalhes do cliente com telefone, observações e histórico",
          "Ações: visualizar, editar, renovar e excluir",
          "Bloqueio de cadastro duplicado por usuário",
        ]}
      />
    </AppShell>
  ),
});
