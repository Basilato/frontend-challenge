import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/PagePlaceholder'

export const Route = createFileRoute('/carrinho')({
  component: () => <PagePlaceholder title="Carrinho de NFTs" />,
})
