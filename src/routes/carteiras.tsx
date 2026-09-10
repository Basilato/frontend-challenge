import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/PagePlaceholder'

export const Route = createFileRoute('/carteiras')({
  component: () => <PagePlaceholder title="Carteiras" />,
})
