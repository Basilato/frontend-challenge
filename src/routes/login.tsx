import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/PagePlaceholder'

export const Route = createFileRoute('/login')({
  component: () => <PagePlaceholder title="Login" />,
})
