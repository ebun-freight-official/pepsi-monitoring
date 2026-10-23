const API_URL = import.meta.env.VITE_API_URL || '/api'

export function getToken () {
  return localStorage.getItem('pepsi:token')
}

export function setToken (token) {
  if (token) localStorage.setItem('pepsi:token', token)
  else localStorage.removeItem('pepsi:token')
}

async function request (path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`)
  }
  return data
}

export const api = {
  get: p => request(p),
  post: (p, body) => request(p, { method: 'POST', body: JSON.stringify(body) }),
  put: (p, body) => request(p, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (p, body) =>
    request(p, { method: 'PATCH', body: JSON.stringify(body) }),
  del: p => request(p, { method: 'DELETE' })
}
