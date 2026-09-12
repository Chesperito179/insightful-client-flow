import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmAndamento } from "@/components/EmAndamento";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Meridian Control" },
      {
        name: "description",
        content: "Receitas, despesas, custo dos créditos de servidor e cálculo de lucro.",
      },
      { property: "og:title", content: "Financeiro — Meridian Control" },
      {
        property: "og:description",
        content: "Receitas, despesas, custo dos créditos de servidor e cálculo de lucro.",
      },
    ],
  }),
  component: () => (
    <AppShell titulo="Financeiro" subtitulo="receitas, despesas e resultado" alertas={3}>
      <EmAndamento
        etapa="Etapa 3"
        itens={[
          "Recebimentos, previsões, pendências e atrasos",
          "Despesas e custo dos créditos por servidor",
          "Faturamento mensal e lucro líquido",
        ]}
      />
    </AppShell>
  ),
});
