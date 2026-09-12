import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmAndamento } from "@/components/EmAndamento";

export const Route = createFileRoute("/pagamentos")({
  head: () => ({
    meta: [
      { title: "Pagamentos — Meridian Control" },
      {
        name: "description",
        content: "Registro e histórico de pagamentos por cliente e período, com status.",
      },
      { property: "og:title", content: "Pagamentos — Meridian Control" },
      {
        property: "og:description",
        content: "Registro e histórico de pagamentos por cliente e período, com status.",
      },
    ],
  }),
  component: () => (
    <AppShell titulo="Pagamentos" subtitulo="histórico financeiro dos clientes" alertas={3}>
      <EmAndamento
        etapa="Etapa 5"
        itens={[
          "Registro de pagamentos com status pago e pendente",
          "Consulta por cliente e por período",
          "Integração automática com clientes e financeiro",
        ]}
      />
    </AppShell>
  ),
});
