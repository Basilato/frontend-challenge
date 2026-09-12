import { Toaster as Sonner } from 'sonner'

/**
 * App-wide toast host. Mounted once in RootLayout.
 *
 * Sonner paints every toast via its own CSS custom properties
 * (`--normal-bg`, `--success-text`, etc.) applied through a plain
 * `background`/`color` declaration — Tailwind classes passed through
 * `toastOptions.classNames` lose that specificity/order fight and get
 * silently overridden, which is why the toast used to render with sonner's
 * default light theme (white background, near-black text) instead of the
 * app's dark identity. Setting those same variables inline here, one level
 * up, wins every time because inline styles cascade over any stylesheet
 * rule regardless of source order.
 *
 * Every toast type keeps the same dark surface-card body — this app has no
 * green/red/blue/yellow anywhere else, so state is communicated the same
 * way it is on edition pills and form fields: an accent-colored border plus
 * the (already currentColor-filled) icon, not a differently-tinted panel.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      theme="dark"
      richColors
      style={
        {
          '--border-radius': '10px',
          '--normal-bg': 'var(--color-surface-card)',
          '--normal-border': 'var(--color-border)',
          '--normal-text': 'var(--color-fg)',
          '--success-bg': 'var(--color-surface-card)',
          '--success-border': 'var(--color-primary)',
          '--success-text': 'var(--color-text-accent)',
          '--info-bg': 'var(--color-surface-card)',
          '--info-border': 'var(--color-border-soft)',
          '--info-text': 'var(--color-fg)',
          '--warning-bg': 'var(--color-surface-card)',
          '--warning-border': 'var(--color-primary)',
          '--warning-text': 'var(--color-text-accent)',
          '--error-bg': 'var(--color-surface-card)',
          '--error-border': 'var(--color-destructive)',
          '--error-text': 'var(--color-destructive)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          // Sonner hardcodes box-shadow and the description color on
          // selectors more specific than a single Tailwind class
          // (`[data-sonner-toast][data-styled=true]`), so those two need
          // `!important` to actually win; everything else here isn't
          // contested by a same-or-higher-specificity sonner rule.
          toast: 'font-mono text-sm !shadow-lg',
          description: '!text-text-secondary',
          actionButton: '!font-mono !font-bold',
          cancelButton: '!font-mono',
        },
        actionButtonStyle: { background: 'var(--color-primary)', color: 'var(--color-ink)' },
        cancelButtonStyle: { background: 'var(--color-surface-raised)', color: 'var(--color-fg)' },
      }}
    />
  )
}
