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

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider>
          <RouterProvider router={router} />
        </RealtimeProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
})
