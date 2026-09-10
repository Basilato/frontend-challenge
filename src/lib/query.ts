import { QueryClient } from '@tanstack/react-query'

import { ApiError } from './http'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Only retry transient/network failures, never 4xx.
          if (error instanceof ApiError) {
            return (error.kind === 'transient' || error.kind === 'network') && failureCount < 2
          }
          return failureCount < 2
        },
      },
      mutations: {
        // Order mutations carry an idempotency key and are retried explicitly, not here.
        retry: false,
      },
    },
  })
}
