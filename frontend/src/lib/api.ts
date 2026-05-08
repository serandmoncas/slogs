import axios from 'axios'
import { getToken, clearToken } from './auth'

// En producción (Vercel) usa el proxy /proxy/* → Railway (sin CORS)
// En desarrollo local usa el backend directo
const baseURL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '/proxy/api/v1'
    : 'http://localhost:8000/api/v1')

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      clearToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
