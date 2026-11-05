const BASE = '/api';

export const getToken = () => localStorage.getItem('qm_token');
export const setToken = (t) => (t ? localStorage.setItem('qm_token', t) : localStorage.removeItem('qm_token'));

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form; // browser sets the multipart boundary itself
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: payload });
  } catch {
    throw new Error('Cannot reach the server. Please check your connection.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Something went wrong');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),

  listings: (query = '') => request(`/listings${query ? `?${query}` : ''}`),
  listing: (id) => request(`/listings/${id}`),
  myListings: () => request('/listings/mine'),
  createListing: (form) => request('/listings', { method: 'POST', form }),
  updateListing: (id, form) => request(`/listings/${id}`, { method: 'PUT', form }),
  toggleStatus: (id) => request(`/listings/${id}/status`, { method: 'PATCH' }),
  deleteListing: (id) => request(`/listings/${id}`, { method: 'DELETE' }),
};
