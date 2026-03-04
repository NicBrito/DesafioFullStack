const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

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
