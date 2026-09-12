import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmAndamento } from "@/components/EmAndamento";

export const Route = createFileRoute("/renovacoes")({
  head: () => ({
    meta: [
      { title: "Renovações — Meridian Control" },
      {
        name: "description",
        content: "Acompanhamento de vencimentos e renovação de clientes por período.",
      },
      { property: "og:title", content: "Renovações — Meridian Control" },
      {
        property: "og:description",
        content: "Acompanhamento de vencimentos e renovação de clientes por período.",
      },
    ],
  }),
  component: () => (
    <AppShell titulo="Renovações" subtitulo="controle de vencimentos" alertas={3}>
      <EmAndamento
        etapa="Etapa 4"
        itens={[
          "Filtros: vence hoje, amanhã, 3, 7 e 30 dias, vencidos",
          "Renovação direta pela lista",
          "Atualização automática da data de expiração",
        ]}
      />
    </AppShell>
  ),
});
