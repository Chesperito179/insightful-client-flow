import type { ExpirationStatus } from "@/lib/data";

const tone: Record<ExpirationStatus, string> = {
  ativo: "bg-success",
  vencendo: "bg-warning",
  vencido: "bg-danger",
};

export function StatusDot({ status, className = "" }: { status: ExpirationStatus; className?: string }) {
  const label = status === "ativo" ? "Ativo" : status === "vencendo" ? "Próximo de vencer" : "Vencido";
  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-block size-1.5 shrink-0 rounded-full align-middle ${tone[status]} ${className}`}
    />
  );
}
