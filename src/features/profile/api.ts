import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ChangePasswordRequest, UpdateProfileRequest, User } from '@/contracts'
import { http } from '@/lib/http'
import { authKeys } from '@/features/auth/api'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdateProfileRequest) => {
      const { data } = await http.patch<User>('/profile', body)
      return data
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.session, (prev: { user: User; expiresAt: string } | null) =>
        prev ? { ...prev, user } : prev,
      )
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (body: ChangePasswordRequest) => {
      await http.post('/profile/password', body)
    },
  })
}
