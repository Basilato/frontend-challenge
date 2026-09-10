import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/PagePlaceholder'

export const Route = createFileRoute('/favoritos')({
  component: () => (
    <PagePlaceholder
      title="Favoritos"
      note="Lista de NFTs favoritados — será construída junto do fluxo de conta."
    />
  ),
})
