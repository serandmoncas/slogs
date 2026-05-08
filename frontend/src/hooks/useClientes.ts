import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Cliente, PaginatedResponse } from '@/types'

export function useClientes(params: { q?: string; page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: async () => {
      const p = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
      const { data } = await api.get<PaginatedResponse<Cliente>>('/clientes', { params: p })
      return data
    },
  })
}

export function useCliente(id: number) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: async () => {
      const { data } = await api.get<Cliente>(`/clientes/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<Cliente>('/clientes', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  })
}

export function useUpdateCliente(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.put<Cliente>(`/clientes/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  })
}

export function useDeleteCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/clientes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  })
}
