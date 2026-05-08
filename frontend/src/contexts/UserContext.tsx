'use client'
import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { getToken } from '@/lib/auth'
import type { User } from '@/types'

interface UserContextValue {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
}

const UserContext = createContext<UserContextValue>({ user: null, isAdmin: false, isLoading: true })

export function useCurrentUser() {
  return useContext(UserContext)
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data } = await api.get<User>('/auth/me')
      return data
    },
    enabled: !!getToken(),
    staleTime: 5 * 60_000,
  })

  return (
    <UserContext.Provider value={{ user: user ?? null, isAdmin: user?.rol === 'admin', isLoading }}>
      {children}
    </UserContext.Provider>
  )
}
