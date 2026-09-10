import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/PagePlaceholder'

export const Route = createFileRoute('/pedido/$orderId')({
  component: () => <PagePlaceholder title="Confirmação de Pedido" />,
})
