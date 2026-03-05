const isProduction = import.meta.env.PROD
const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim()
const API_URL = configuredApiUrl || (isProduction ? '' : 'http://localhost:8000')

if (isProduction && !API_URL) {
  throw new Error(
    'Configuração ausente: defina VITE_API_URL no deploy para a URL pública do backend.',
  )
}

function buildUrl(path) {
  const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${base}${suffix}`
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(buildUrl(path), {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })
  } catch {
    if (isProduction) {
      throw new Error('Falha de conexão com a API. Verifique VITE_API_URL e CORS do backend.')
    }
    throw new Error('Falha de conexão com a API local. Confirme se o backend está em execução.')
  }

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || 'Falha na requisição')
  }
  return data
}

export function listResources(page, pageSize) {
  return request(`/resources?page=${page}&page_size=${pageSize}`)
}

export function createResource(payload) {
  return request('/resources', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateResource(id, payload) {
  return request(`/resources/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function deleteResource(id) {
  return request(`/resources/${id}`, { method: 'DELETE' })
}

export function assistDescription(payload) {
  return request('/assist', { method: 'POST', body: JSON.stringify(payload) })
}
