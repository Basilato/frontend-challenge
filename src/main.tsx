import '@/mocks/install-socket' // first — patches WebSocket before socket.io-client loads

import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { createAppRouter } from '@/app/router'
import { createQueryClient } from '@/lib/query'
import { RealtimeProvider } from '@/features/realtime/RealtimeProvider'
import { enableMocking } from '@/mocks/enable'

import './styles/app.css'

const queryClient = createQueryClient()
const router = createAppRouter(queryClient)

// Kick off mock registration in the background — first paint doesn't wait on
// it. `lib/http.ts`'s request interceptor awaits this same (memoized) promise
// before any request leaves, so data still only ever reaches mocked handlers;
// this just decouples FCP from the service-worker round trip.
enableMocking()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider>
        <RouterProvider router={router} />
      </RealtimeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
