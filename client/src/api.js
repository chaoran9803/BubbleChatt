const API_BASE = 'http://localhost:3000';

export function getToken() {
  return localStorage.getItem('bc_token');
}

export function getStoredAuth() {
  const token = localStorage.getItem('bc_token');
  const username = localStorage.getItem('bc_username');
  const userId = localStorage.getItem('bc_userId');
  return token && username && userId ? { token, username, userId } : null;
}

export function storeAuth({ token, username, userId }) {
  localStorage.setItem('bc_token', token);
  localStorage.setItem('bc_username', username);
  localStorage.setItem('bc_userId', userId);
}

export function clearAuth() {
  localStorage.removeItem('bc_token');
  localStorage.removeItem('bc_username');
  localStorage.removeItem('bc_userId');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  signup: (username, password) => request('/auth/signup', { method: 'POST', body: { username, password }, auth: false }),
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password }, auth: false }),

  getFriends: () => request('/friends'),
  getFriendRequests: () => request('/friends/requests'),
  sendFriendRequest: (username) => request('/friends/request', { method: 'POST', body: { username } }),
  acceptFriendRequest: (requestId) => request(`/friends/${requestId}/accept`, { method: 'POST' }),
  declineFriendRequest: (requestId) => request(`/friends/${requestId}/decline`, { method: 'POST' }),

  getConversations: () => request('/conversations'),
  createConversation: (memberIds, name) => request('/conversations', { method: 'POST', body: { memberIds, name } }),
  getMessages: (conversationId) => request(`/conversations/${conversationId}/messages`),
};
