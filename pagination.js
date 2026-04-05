class PaginationFooter extends HTMLElement {
  /* ── Lifecycle ─────────────────────────────────────────── */

  static get observedAttributes() {
    return ["pages", "page", "limit", "mode"];
  }

  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._maxBtn = 9; // current derived max; updated by ResizeObserver
    this._ro = null;
  }

  connectedCallback() {
    this._initResizeObserver();
    this._render();
  }

  disconnectedCallback() {
    if (this._ro) this._ro.disconnect();
  }

  attributeChangedCallback() {
    this._render();
  }

  /* ── Attribute Helpers ─────────────────────────────────── */

  _num(attr, fallback = 1) {
    const v = parseInt(this.getAttribute(attr), 10);
    return Number.isFinite(v) ? v : fallback;
  }

  /* ── URL Helper ────────────────────────────────────────── */

  /**
   * buildLink(p) → "?page=X&limit=Y"
   * Preserves any existing query params in the current URL.
   */
  buildLink(p) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("page", p);
      url.searchParams.set("limit", this._num("limit", 10));
      return url.search; // e.g. "?page=3&limit=10&sort=name"
    } catch {
      return `?page=${p}&limit=${this._num("limit", 10)}`;
    }
  }

  /* ── Responsive: ResizeObserver ────────────────────────── */

  _initResizeObserver() {
    this._ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? this.offsetWidth;
      const next = this.getMaxVisibleButtons(w);
      if (next !== this._maxBtn) {
        this._maxBtn = next;
        this._render();
      }
    });
    this._ro.observe(this);
  }

  /**
   * getMaxVisibleButtons(width) → number
   * Maps container width to a maximum number of page buttons to render.
   * The count includes numbered buttons only (not Prev/Next/ellipsis).
   */
  getMaxVisibleButtons(width) {
    if (width < 320) return 1; // minimal: current only
    if (width < 420) return 3; // 1 … [cur] … last
    if (width < 560) return 5;
    if (width < 720) return 7;
    return 9;
  }

  /* ── Core Pagination Logic ─────────────────────────────── */

  /**
   * computePages(page, pages, maxVisible) → Array<number|'...'>
   *
   * Returns an ordered array of page numbers and ellipsis tokens.
   * Always includes: 1, `pages`, and `page` (current).
   * Builds a window of ±delta around current, then fills with anchors.
   * Gaps ≥ 2 between consecutive entries become '...' tokens.
   *
   * @param {number} page       - current page (1-based)
   * @param {number} pages      - total pages
   * @param {number} maxVisible - max page buttons (numbers only)
   * @returns {Array<number|'...'>}
   */
  computePages(page, pages, maxVisible) {
    // Clamp inputs
    pages = Math.max(1, pages);
    page = Math.min(Math.max(1, page), pages);

    // Trivial case: fits entirely
    if (pages <= maxVisible) {
      return Array.from({ length: pages }, (_, i) => i + 1);
    }

    // Minimal mode: only show current
    if (maxVisible <= 1) return [page];

    // How many slots do we have after reserving first + last?
    // Window = slots around current; delta = half-window size
    // Reserve 2 slots for anchors (1 and pages), rest for window
    const windowSize = Math.max(1, maxVisible - 2);
    const delta = Math.floor(windowSize / 2);

    // Build the sliding window [low…high] centred on current
    let low = page - delta;
    let high = page + delta;

    // If window is even-sized, bias one extra slot to the right
    if (windowSize % 2 === 0) high += 1;

    // Shift window if it undershoots/overshoots
    if (low < 2) {
      high += 2 - low;
      low = 2;
    }
    if (high > pages - 1) {
      low -= high - (pages - 1);
      high = pages - 1;
    }

    // Final clamp (edge: pages is very small)
    low = Math.max(2, low);
    high = Math.min(pages - 1, high);

    // Collect all pages: anchors + window, deduplicated + sorted
    const set = new Set([1, pages]);
    for (let p = low; p <= high; p++) set.add(p);
    const sorted = [...set].sort((a, b) => a - b);

    // Insert ellipsis tokens for gaps ≥ 2
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
        result.push("...");
      }
      result.push(sorted[i]);
    }

    return result;
  }

  /* ── Render ────────────────────────────────────────────── */

  _render() {
    const pages = this._num("pages", 1);
    const page = Math.min(
      Math.max(this._num("page", 1), 1),
      Math.max(pages, 1),
    );
    const limit = this._num("limit", 10);

    const hasPrev = page > 1;
    const hasNext = page < pages;
    const tokens = this.computePages(page, pages, this._maxBtn);

    const prevHref = this.buildLink(page - 1);
    const nextHref = this.buildLink(page + 1);

    /* Build button HTML for each token */
    const btnHTML = tokens
      .map((t) => {
        if (t === "...") {
          return `<span class="ellipsis" aria-hidden="true">…</span>`;
        }
        if (t === page) {
          return `<span class="btn current" aria-current="page" aria-label="Page ${t}">${t}</span>`;
        }
        return `<a class="btn" href="${this.buildLink(t)}" aria-label="Page ${t}">${t}</a>`;
      })
      .join("");

    /* Only show "Page X of Y" label when there are multiple pages */
    const infoHTML =
      pages > 1
        ? `<span class="info"><span class="info__cur">${page}</span><span class="info__sep">/</span><span class="info__tot">${pages.toLocaleString()}</span></span>`
        : `<span class="info"><span class="info__cur">1</span><span class="info__sep">/</span><span class="info__tot">1</span></span>`;

    this._root.innerHTML = `
      <style>
        /* ── Reset & Host ── */
        *, *::before, *::after { box-sizing: border-box; }

        :host {
          display: block;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          --c-bg:       transparent;
          --c-surface:  #1c2129;
          --c-border:   #2a3140;
          --c-hover:    #242c38;
          --c-text:     #a8b4c2;
          --c-muted:    #4a5568;
          --c-accent:   #f5a623;
          --c-accent-bg:#2a1f08;
          --c-disabled: #2a3140;
          --radius:     4px;
          --btn-h:      34px;
          --btn-min-w:  34px;
          --font-sz:    .8rem;
          --gap:        4px;
        }

        /* ── Outer Nav ── */
        nav {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          padding: 8px 0;
          user-select: none;
        }

        /* ── Info Badge ── */
        .info {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: .72rem;
          letter-spacing: .05em;
          color: var(--c-muted);
          margin-right: 2px;
        }
        .info__cur  { color: var(--c-text); font-weight: 700; }
        .info__sep  { color: var(--c-muted); }
        .info__tot  { color: var(--c-muted); }

        /* ── Button Row ── */
        .btn-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--gap);
        }

        /* ── Base Button ── */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: var(--btn-h);
          min-width: var(--btn-min-w);
          padding: 0 8px;
          border-radius: var(--radius);
          font-family: inherit;
          font-size: var(--font-sz);
          font-weight: 500;
          color: var(--c-text);
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          text-decoration: none;
          cursor: pointer;
          transition:
            background 120ms ease,
            border-color 120ms ease,
            color 120ms ease,
            transform 80ms ease;
          white-space: nowrap;
          -webkit-font-smoothing: antialiased;
        }

        a.btn:hover {
          background: var(--c-hover);
          border-color: #3d4f63;
          color: #d0dae5;
          transform: translateY(-1px);
        }
        a.btn:active { transform: translateY(0); }

        /* ── Current (active) page ── */
        .btn.current {
          background: var(--c-accent-bg);
          border-color: var(--c-accent);
          color: var(--c-accent);
          font-weight: 700;
          cursor: default;
          box-shadow: 0 0 0 1px var(--c-accent-bg),
                      inset 0 1px 0 rgba(245,166,35,.1);
        }

        /* ── Disabled nav button ── */
        .btn.disabled {
          opacity: .28;
          pointer-events: none;
          cursor: not-allowed;
          background: transparent;
          border-color: var(--c-disabled);
          color: var(--c-muted);
        }

        /* ── Nav Prev / Next labels ── */
        .nav-label {
          font-size: .68rem;
          letter-spacing: .08em;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .nav-label .arrow {
          font-size: .85rem;
          line-height: 1;
        }

        /* ── Ellipsis ── */
        .ellipsis {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: var(--btn-h);
          min-width: 24px;
          padding: 0 2px;
          font-size: .85rem;
          color: var(--c-muted);
          letter-spacing: .05em;
        }

        /* ── Single-page minimal UI ── */
        .minimal-info {
          font-size: .75rem;
          color: var(--c-muted);
          letter-spacing: .04em;
        }
      </style>

      ${
        pages <= 1
          ? `<nav aria-label="Pagination">
             <span class="minimal-info">1 page</span>
           </nav>`
          : `<nav aria-label="Pagination">
             ${infoHTML}
             <div class="btn-row" role="list">
               ${
                 hasPrev
                   ? `<a class="btn" href="${prevHref}" aria-label="Previous page" role="listitem">
                      <span class="nav-label"><span class="arrow">‹</span> prev</span>
                    </a>`
                   : `<span class="btn disabled" aria-disabled="true" role="listitem">
                      <span class="nav-label"><span class="arrow">‹</span> prev</span>
                    </span>`
               }
               ${btnHTML}
               ${
                 hasNext
                   ? `<a class="btn" href="${nextHref}" aria-label="Next page" role="listitem">
                      <span class="nav-label">next <span class="arrow">›</span></span>
                    </a>`
                   : `<span class="btn disabled" aria-disabled="true" role="listitem">
                      <span class="nav-label">next <span class="arrow">›</span></span>
                    </span>`
               }
             </div>
           </nav>`
      }
    `;

    let mode = this.getAttribute("mode");
    if (mode == "spa") {
      this._root.querySelectorAll("a").forEach((anchor) => {
        anchor.onclick = (e) => {
          let params = new URLSearchParams(anchor.href);
          let page = params.get("page");
          if (!page) return;
          e.preventDefault();
          let limit = params.get("limit");
          let event = new CustomEvent("page-change-request", {
            detail: { page, limit },
          });
          this.dispatchEvent(event);
        };
      });
    }
  }
}

customElements.define("pagination-footer", PaginationFooter);
