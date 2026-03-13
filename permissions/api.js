class AuthzApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  setToken(token) {
    this.token = token;
  }

  async request(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (res.status == 401) location.replace("/auth?next=/permissions");

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const contentType = res.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return res.json();
    }

    return res.text();
  }

  // -------------------------
  // Permissions
  // -------------------------

  async listPermissions(namespace = null) {
    const params = new URLSearchParams();

    if (namespace) params.append("namespace", namespace);

    return this.request(`/list_permissions?${params.toString()}`, {
      method: "GET",
    });
  }

  // -------------------------
  // Grants
  // -------------------------

  async listGrants(filter = {}) {
    const params = new URLSearchParams(filter);

    return this.request(`/list_grants?${params.toString()}`, {
      method: "GET",
    });
  }

  async grantPermission(req) {
    return this.request(`/grant`, {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  async denyPermission(req) {
    return this.request(`/deny_permission`, {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  // -------------------------
  // Tokens
  // -------------------------

  async createTenantToken(aud, tenant) {
    return this.request(`/user_token/${aud}`, {
      method: "POST",
      body: JSON.stringify({ tenant }),
    });
  }

  async getToken(aud) {
    return this.request(`/token/${aud}`, {
      method: "POST",
    });
  }

  // -------------------------
  // Example protected routes
  // -------------------------

  async read() {
    return this.request(`/read`, {
      method: "POST",
    });
  }

  async write() {
    return this.request(`/write`, {
      method: "POST",
    });
  }
}
