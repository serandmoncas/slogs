import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Puerto, PaginatedResponse } from '@/types'

export function usePuertos(params: { q?: string; page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ['puertos', params],
    queryFn: async () => {
      const p = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
      const { data } = await api.get<PaginatedResponse<Puerto>>('/puertos', { params: p })
      return data
    },
  })
}

export function usePuerto(id: number) {
  return useQuery({
    queryKey: ['puertos', id],
    queryFn: async () => {
      const { data } = await api.get<Puerto>(`/puertos/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreatePuerto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<Puerto>('/puertos', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['puertos'] }),
  })
}

export function useUpdatePuerto(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.put<Puerto>(`/puertos/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['puertos'] }),
  })
}

export function useDeletePuerto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/puertos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['puertos'] }),
  })
}
