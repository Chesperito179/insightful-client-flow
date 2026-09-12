import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmAndamento } from "@/components/EmAndamento";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Meridian Control" },
      {
        name: "description",
        content: "Servidores, custos de crédito, aplicativos, valores e usuários do sistema.",
      },
      { property: "og:title", content: "Configurações — Meridian Control" },
      {
        property: "og:description",
        content: "Servidores, custos de crédito, aplicativos, valores e usuários do sistema.",
      },
    ],
  }),
  component: () => (
    <AppShell titulo="Configurações" subtitulo="servidores, aplicativos e valores" alertas={3}>
      <EmAndamento
        etapa="Etapa 7"
        itens={[
          "Servidores com custo de crédito e status",
          "Aplicativos e valores de planos",
          "Usuários administrativos e ajustes gerais",
        ]}
      />
    </AppShell>
  ),
});
