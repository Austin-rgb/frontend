class ProductAPI {
  constructor({ baseURL = "", token = null } = {}) {
    this.baseURL = baseURL.replace(/\/$/, "");
    this.token = token;
  }

  setToken(token) {
    this.token = token;
  }

  _headers(extra = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...extra,
    };

    return headers;
  }

  async _request(path, options = {}) {
    const res = await fetch(this.baseURL + path, {
      ...options,
      headers: this._headers(options.headers),
    });

    if (!res.ok) {
      let err;

      try {
        err = await res.json();
      } catch {
        err = { error: res.statusText };
        if (res.status == 401) location.replace("/auth?next=/catalog");
        console.log(res);
      }

      throw new Error(err.error || res.statusText);
    }

    const contentType = res.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return res.json();
    }

    return res.text();
  }

  /**
   * Create product
   * POST /products
   */
  async createProduct(dto) {
    return this._request("/products", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  }

  /**
   * GET /products/{id}
   */
  async getProduct(id) {
    return this._request(`/products/${encodeURIComponent(id)}`);
  }

  /**
   * GET /products/slug/{slug}
   */
  async getProductBySlug(slug) {
    return this._request(`/products/slug/${encodeURIComponent(slug)}`);
  }

  /**
   * GET /products
   */
  async listProducts(query = {}) {
    const qs = new URLSearchParams(query).toString();
    const path = qs ? `/products?${qs}` : "/products";
    return this._request(path);
  }

  /**
   * Fetch catalog HTML
   * GET /
   */
  async getCatalogPage(query = {}) {
    const qs = new URLSearchParams(query).toString();
    const path = qs ? `/?${qs}` : "/";
    return this._request(path);
  }
}
