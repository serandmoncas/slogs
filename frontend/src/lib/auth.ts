export function getToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)slogs_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function setToken(token: string): void {
  const maxAge = 30 * 60 // 30 minutos
  document.cookie = `slogs_token=${encodeURIComponent(token)}; path=/; samesite=strict; max-age=${maxAge}`
}

export function clearToken(): void {
  document.cookie = 'slogs_token=; path=/; max-age=0'
}
