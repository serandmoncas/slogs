export type EstadoEnvio = 'PENDIENTE' | 'EN_TRÁNSITO' | 'ENTREGADO' | 'CANCELADO'
export type TipoBodega = 'NACIONAL' | 'INTERNACIONAL'
export type TipoPuerto = 'NACIONAL' | 'INTERNACIONAL'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
}

export interface User {
  id: number
  email: string
  nombre: string
  rol: string
  is_active: boolean
  created_at: string
}

export interface Cliente {
  id: number
  nombre: string
  nit: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  created_at: string
}

export interface Producto {
  id: number
  nombre: string
  descripcion: string | null
  categoria: string
  created_at: string
}

export interface Bodega {
  id: number
  nombre: string
  ciudad: string
  direccion: string
  capacidad: number
  tipo: TipoBodega
  created_at: string
}

export interface Puerto {
  id: number
  nombre: string
  ciudad: string
  pais: string
  codigo: string
  tipo: TipoPuerto
  created_at: string
}

export interface EnvioTerrestre {
  id: number
  numero_guia: string
  cantidad: number
  fecha_registro: string
  fecha_entrega: string
  precio_envio: string
  descuento_pct: string
  precio_final: string
  placa: string
  estado: EstadoEnvio
  created_at: string
  updated_at: string
  cliente: Cliente
  producto: Producto
  bodega: Bodega
}

export interface EnvioMaritimo {
  id: number
  numero_guia: string
  cantidad: number
  fecha_registro: string
  fecha_entrega: string
  precio_envio: string
  descuento_pct: string
  precio_final: string
  numero_flota: string
  estado: EstadoEnvio
  created_at: string
  updated_at: string
  cliente: Cliente
  producto: Producto
  puerto: Puerto
}

export interface EstadoStats {
  PENDIENTE: number
  EN_TRANSITO: number
  ENTREGADO: number
  CANCELADO: number
}

export interface DashboardStats {
  total_envios: number
  terrestres: number
  maritimos: number
  entregados_hoy: number
  ingresos_mes: string
  por_estado: EstadoStats
}
