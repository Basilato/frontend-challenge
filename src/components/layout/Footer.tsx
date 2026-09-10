export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-card/60">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-8 text-xs text-text-secondary md:px-6">
        <p>© {new Date().getFullYear()} Kurio · Propriedade digital pura, feita simples.</p>
        <p className="mt-1 text-text-secondary/70">
          Marketplace de demonstração — dados simulados, sem blockchain real.
        </p>
      </div>
    </footer>
  )
}
