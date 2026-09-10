import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/PagePlaceholder'

export const Route = createFileRoute('/perfil')({
  component: () => <PagePlaceholder title="Perfil do Colecionador" />,
})
