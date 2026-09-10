import { Toaster as Sonner } from 'sonner'

/** App-wide toast host. Mounted once in RootLayout. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            'font-mono rounded-[10px] border border-border bg-surface-card text-fg text-sm shadow-lg',
          description: 'text-text-secondary',
          actionButton: 'bg-primary text-ink',
        },
      }}
    />
  )
}
