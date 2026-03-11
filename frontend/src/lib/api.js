const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  const json = await res.json()
  if (!res.ok || !json.success) throw new Error(json.error || 'API error')
  return json.data
}

// ─── Boards ─────────────────────────────────────────────────────────────────
export const api = {
  getBoards: () => request('/api/boards'),
  getBoard: (id) => request(`/api/boards/${id}`),
  createBoard: (body) => request('/api/boards', { method: 'POST', body: JSON.stringify(body) }),

  getBoardColumns: (boardId) => request(`/api/boards/${boardId}/columns`),

  // ─── Columns ──────────────────────────────────────────────────────────────
  createColumn: (body) => request('/api/columns', { method: 'POST', body: JSON.stringify(body) }),
  updateColumn: (id, body) => request(`/api/columns/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteColumn: (id) => request(`/api/columns/${id}`, { method: 'DELETE' }),

  // ─── Cards ────────────────────────────────────────────────────────────────
  createCard: (body) => request('/api/cards', { method: 'POST', body: JSON.stringify(body) }),
  updateCard: (id, body) => request(`/api/cards/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCard: (id) => request(`/api/cards/${id}`, { method: 'DELETE' }),
  moveCard: (id, body) => request(`/api/cards/${id}/move`, { method: 'POST', body: JSON.stringify(body) }),
}

export default api
