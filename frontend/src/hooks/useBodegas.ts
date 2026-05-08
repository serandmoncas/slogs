import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Bodega, PaginatedResponse } from '@/types'

export function useBodegas(params: { q?: string; page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ['bodegas', params],
    queryFn: async () => {
      const p = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
      const { data } = await api.get<PaginatedResponse<Bodega>>('/bodegas', { params: p })
      return data
    },
  })
}

export function useBodega(id: number) {
  return useQuery({
    queryKey: ['bodegas', id],
    queryFn: async () => {
      const { data } = await api.get<Bodega>(`/bodegas/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateBodega() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<Bodega>('/bodegas', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bodegas'] }),
  })
}

export function useUpdateBodega(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.put<Bodega>(`/bodegas/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bodegas'] }),
  })
}

export function useDeleteBodega() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/bodegas/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bodegas'] }),
  })
}
