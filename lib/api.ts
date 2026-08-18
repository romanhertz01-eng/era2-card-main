const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('era2_token')
}

export const setToken = (token: string): void => {
  localStorage.setItem('era2_token', token)
}

export const clearToken = (): void => {
  localStorage.removeItem('era2_token')
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null as T

  const data = await res.json()
  if (!res.ok) throw { status: res.status, ...(typeof data === 'object' ? data : { error: data }) }
  return data as T
}

async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (res.status === 204) return null as T

  const data = await res.json()
  if (!res.ok) throw { status: res.status, ...(typeof data === 'object' ? data : { error: data }) }
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  postForm: <T>(path: string, formData: FormData) => requestForm<T>(path, formData),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
