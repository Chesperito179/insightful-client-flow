export type Periodo = "mes" | "anterior" | "30dias";

export function periodoRange(periodo: Periodo, ref: Date): { inicio: Date; fim: Date } {
  if (periodo === "30dias") {
    const fim = new Date(ref);
    const inicio = new Date(ref);
    inicio.setDate(inicio.getDate() - 30);
    return { inicio, fim };
  }
  const ano = ref.getFullYear();
  const mes = periodo === "anterior" ? ref.getMonth() - 1 : ref.getMonth();
  const inicio = new Date(ano, mes, 1);
  const fim = new Date(ano, mes + 1, 0, 23, 59, 59);
  return { inicio, fim };
}

export const dentroDe = (iso: string, r: { inicio: Date; fim: Date }) => {
  const d = new Date(`${iso}T12:00:00`);
  return d >= r.inicio && d <= r.fim;
};

export const periodoLabel = (periodo: Periodo): string =>
  periodo === "mes" ? "Este mês" : periodo === "anterior" ? "Mês anterior" : "Últimos 30 dias";
