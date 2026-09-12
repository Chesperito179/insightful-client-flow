export function EmAndamento({ etapa, itens }: { etapa: string; itens: string[] }) {
  return (
    <section className="animate-rise max-w-2xl rounded-xl border border-border/60 bg-panel/40 p-6 backdrop-blur-md">
      <p className="label-mono">{etapa}</p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
        Área preparada, construção na próxima etapa
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A estrutura e a navegação já existem. Estes recursos entram nesta área:
      </p>
      <ul className="mt-4 space-y-2 text-[13px] text-muted-foreground">
        {itens.map((item) => (
          <li key={item} className="flex items-center gap-3">
            <span className="size-1.5 shrink-0 rounded-full bg-faint/40" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
