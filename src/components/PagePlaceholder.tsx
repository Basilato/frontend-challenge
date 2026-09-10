export function PagePlaceholder({ title, note }: { title: string; note?: string }) {
  return (
    <section className="rounded-card bg-surface-card p-10">
      <h1 className="text-xl font-bold text-text-accent">{title}</h1>
      <p className="mt-2 text-sm text-text-secondary">
        {note ?? 'Tela ainda não implementada — será construída a partir do Figma.'}
      </p>
    </section>
  )
}
