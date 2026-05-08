import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Producto, PaginatedResponse } from '@/types'

export function useProductos(params: { q?: string; page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ['productos', params],
    queryFn: async () => {
      const p = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      )
      const { data } = await api.get<PaginatedResponse<Producto>>('/productos', { params: p })
      return data
    },
  })
}

export function useProducto(id: number) {
  return useQuery({
    queryKey: ['productos', id],
    queryFn: async () => {
      const { data } = await api.get<Producto>(`/productos/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<Producto>('/productos', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos'] }),
  })
}

export function useUpdateProducto(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.put<Producto>(`/productos/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos'] }),
  })
}

export function useDeleteProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/productos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos'] }),
  })
}
