import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmAndamento } from "@/components/EmAndamento";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Meridian Control" },
      {
        name: "description",
        content: "Faturamento, lucro, base de clientes e receita por servidor e aplicativo.",
      },
      { property: "og:title", content: "Relatórios — Meridian Control" },
      {
        property: "og:description",
        content: "Faturamento, lucro, base de clientes e receita por servidor e aplicativo.",
      },
    ],
  }),
  component: () => (
    <AppShell titulo="Relatórios" subtitulo="análise de dados do sistema" alertas={3}>
      <EmAndamento
        etapa="Etapa 6"
        itens={[
          "Faturamento e lucro por mês",
          "Clientes novos, ativos, vencidos e cancelados",
          "Receita por servidor e por aplicativo, ticket médio",
        ]}
      />
    </AppShell>
  ),
});
