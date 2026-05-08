import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { EnvioMaritimo, PaginatedResponse } from '@/types'

interface Filters { estado?: string; fecha_inicio?: string; fecha_fin?: string; cliente_id?: number; page?: number; size?: number }

export function useEnviosMaritimos(filters: Filters = {}) {
  return useQuery({
    queryKey: ['envios-maritimos', filters],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''))
      const { data } = await api.get<PaginatedResponse<EnvioMaritimo>>('/envios/maritimos', { params })
      return data
    },
  })
}

export function useEnvioMaritimo(id: number) {
  return useQuery({
    queryKey: ['envios-maritimos', id],
    queryFn: async () => {
      const { data } = await api.get<EnvioMaritimo>(`/envios/maritimos/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateEnvioMaritimo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<EnvioMaritimo>('/envios/maritimos', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['envios-maritimos'] }),
  })
}

export function useUpdateEnvioMaritimo(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.put<EnvioMaritimo>(`/envios/maritimos/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['envios-maritimos'] }),
  })
}

export function useDeleteEnvioMaritimo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/envios/maritimos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['envios-maritimos'] }),
  })
}
