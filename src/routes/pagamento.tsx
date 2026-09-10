import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/PagePlaceholder'

export const Route = createFileRoute('/pagamento')({
  component: () => <PagePlaceholder title="Pagamento" />,
})
