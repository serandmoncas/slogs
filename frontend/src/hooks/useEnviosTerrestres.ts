import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { EnvioTerrestre, PaginatedResponse } from '@/types'

interface Filters {
  estado?: string
  fecha_inicio?: string
  fecha_fin?: string
  cliente_id?: number
  page?: number
  size?: number
}

export function useEnviosTerrestres(filters: Filters = {}) {
  return useQuery({
    queryKey: ['envios-terrestres', filters],
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
      )
      const { data } = await api.get<PaginatedResponse<EnvioTerrestre>>('/envios/terrestres', {
        params,
      })
      return data
    },
  })
}

export function useEnvioTerrestre(id: number) {
  return useQuery({
    queryKey: ['envios-terrestres', id],
    queryFn: async () => {
      const { data } = await api.get<EnvioTerrestre>(`/envios/terrestres/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateEnvioTerrestre() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<EnvioTerrestre>('/envios/terrestres', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['envios-terrestres'] }),
  })
}

export function useUpdateEnvioTerrestre(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.put<EnvioTerrestre>(`/envios/terrestres/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['envios-terrestres'] }),
  })
}

export function useDeleteEnvioTerrestre() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/envios/terrestres/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['envios-terrestres'] }),
  })
}
