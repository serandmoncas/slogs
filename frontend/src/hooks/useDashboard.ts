import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { DashboardStats } from '@/types'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>('/dashboard/stats')
      return data
    },
    refetchInterval: 30_000,
  })
}
