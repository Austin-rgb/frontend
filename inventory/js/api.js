// api.js — REST API communication layer

const CONFIG = {
  BASE_URL: window.APP_CONFIG?.API_BASE_URL ?? 'http://localhost:8080/api',
  TIMEOUT_MS: 10000,
};

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

  const url = `${CONFIG.BASE_URL}${path}`;
  const init = {
    signal: controller.signal,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };

  try {
    const response = await fetch(url, init);
    clearTimeout(timer);

    let body = null;
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      body = await response.json();
    } else if (response.status !== 204) {
      body = await response.text();
    }

    if (!response.ok) {
      const message =
        (typeof body === 'object' && body?.message) ||
        (typeof body === 'string' && body) ||
        `HTTP ${response.status}`;
      throw new ApiError(message, response.status, body);
    }

    return body;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new ApiError('Request timed out', 408, null);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message ?? 'Network error', 0, null);
  }
}

export const api = {
  /** GET /items — returns array of inventory items */
  listItems() {
    return request('/items');
  },

  /** GET /items/:id */
  getItem(id) {
    return request(`/items/${encodeURIComponent(id)}`);
  },

  /** POST /items */
  createItem(payload) {
    return request('/items', { method: 'POST', body: JSON.stringify(payload) });
  },

  /** PUT /items/:id */
  updateItem(id, payload) {
    return request(`/items/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /** DELETE /items/:id */
  deleteItem(id) {
    return request(`/items/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  /** Expose config so other modules can display the base URL */
  getBaseUrl() {
    return CONFIG.BASE_URL;
  },
};

