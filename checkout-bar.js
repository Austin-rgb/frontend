/**
 * <checkout-bar> — Reusable Checkout Bar Web Component
 * No frameworks. No dependencies. Pure Web Components + Shadow DOM.
 *
 * Attributes:
 *   items        — number of items in cart
 *   total        — total price (numeric)
 *   checkout-url — URL to redirect on checkout
 *
 * JS Property:
 *   element.data = { items, total, cart: [{ name, price }] }
 *
 * CSS Custom Properties (on the host element):
 *   --cb-bg            Bar background color
 *   --cb-accent        Accent / button color
 *   --cb-text          Primary text color
 *   --cb-height        Bar height
 *   --cb-font          Font family
 *   --cb-radius        Button border radius
 *   --cb-z             z-index
 */

class CheckoutBar extends HTMLElement {
  /* ─── Lifecycle ─────────────────────────────────────────────── */

  static get observedAttributes() {
    return ["items", "total", "checkout-url"];
  }

  constructor() {
    super();
    this._data = { items: 0, total: 0, cart: [] };
    this._shadow = this.attachShadow({ mode: "open" });

    // Scroll direction tracking
    this._lastY = window.scrollY;
    this._ticking = false;
    this._onScroll = this._handleScroll.bind(this);
  }

  connectedCallback() {
    this._render();
    window.addEventListener("scroll", this._onScroll, { passive: true });
    // Set initial position
    this._applyScrollPos(window.scrollY === 0 ? "bottom" : "top");
  }

  disconnectedCallback() {
    window.removeEventListener("scroll", this._onScroll);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === "items") this._data.items = parseInt(newVal, 10) || 0;
    if (name === "total") this._data.total = parseFloat(newVal) || 0;
    // checkout-url is read on the fly — no re-render needed
    this._updateSummary();
  }

  /* ─── Public API ─────────────────────────────────────────────── */

  get data() {
    return { ...this._data };
  }

  set data(val) {
    if (!val || typeof val !== "object") return;
    this._data = {
      items: parseInt(val.items, 10) || 0,
      total: parseFloat(val.total) || 0,
      cart: Array.isArray(val.cart) ? val.cart : [],
    };
    this._updateSummary();
  }

  /* ─── Scroll Handling ────────────────────────────────────────── */

  _handleScroll() {
    if (this._ticking) return;
    this._ticking = true;
    requestAnimationFrame(() => {
      const currentY = window.scrollY;
      const dir = currentY > this._lastY ? "top" : "bottom";
      this._applyScrollPos(dir);
      this._lastY = currentY;
      this._ticking = false;
    });
  }

  _applyScrollPos(pos) {
    const bar = this._shadow.querySelector(".bar");
    if (!bar) return;
    if (pos === "top") {
      bar.classList.add("at-top");
      bar.classList.remove("at-bottom");
    } else {
      bar.classList.add("at-bottom");
      bar.classList.remove("at-top");
    }
  }

  /* ─── Rendering ──────────────────────────────────────────────── */

  _render() {
    this._shadow.innerHTML = `
      <style>${this._css()}</style>
      ${this._html()}
    `;
    this._bindEvents();
  }

  _updateSummary() {
    const s = this._shadow;
    if (!s) return;

    const summary = s.querySelector(".summary-text");
    const btn = s.querySelector(".checkout-btn");
    const empty = s.querySelector(".empty-state");

    if (!summary) return; // not yet rendered

    const isEmpty = this._data.items === 0;

    if (summary) summary.textContent = this._summaryText();
    if (empty) empty.hidden = !isEmpty;
    if (btn) btn.disabled = isEmpty;

    const pip = s.querySelector(".item-count");
    if (pip) {
      pip.textContent = isEmpty ? "" : this._data.items;
      pip.hidden = isEmpty;
    }
  }

  _summaryText() {
    const { items, total } = this._data;
    if (items === 0) return "🛒 Your cart is empty";
    const label = items === 1 ? "item" : "items";
    return `🛒 ${items} ${label} — ${this._fmt(total)}`;
  }

  _fmt(n) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(n);
  }

  /* ─── Event Binding ──────────────────────────────────────────── */

  _bindEvents() {
    const s = this._shadow;

    // Summary click → open modal
    s.querySelector(".summary-btn").addEventListener("click", () =>
      this._openModal(),
    );

    // Checkout button
    s.querySelector(".checkout-btn").addEventListener("click", () => {
      const url = this.getAttribute("checkout-url") || "/checkout";
      this.dispatchEvent(
        new CustomEvent("checkout", {
          bubbles: true,
          composed: true,
          detail: { ...this._data },
        }),
      );
      window.location.href = url;
    });

    // Modal backdrop click
    s.querySelector(".modal-backdrop").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) this._closeModal();
    });

    // Close button
    s.querySelector(".modal-close").addEventListener("click", () =>
      this._closeModal(),
    );

    // ESC key (captured on shadow root)
    this._keyHandler = (e) => {
      if (e.key === "Escape") this._closeModal();
    };
    document.addEventListener("keydown", this._keyHandler);
  }

  /* ─── Modal ──────────────────────────────────────────────────── */

  _openModal() {
    const s = this._shadow;
    const backdrop = s.querySelector(".modal-backdrop");
    const list = s.querySelector(".cart-list");

    // Populate list
    list.innerHTML = "";
    if (!this._data.cart.length) {
      const li = document.createElement("li");
      li.className = "cart-empty";
      li.textContent = "No item details available.";
      list.appendChild(li);
    } else {
      this._data.cart.forEach((item) => {
        const li = document.createElement("li");
        li.className = "cart-item";
        li.innerHTML = `
          <span class="ci-name">${this._esc(item.name)}</span>
          <span class="ci-price">${this._fmt(item.price)}</span>
        `;
        list.appendChild(li);
      });

      // Total row
      const tr = document.createElement("li");
      tr.className = "cart-total-row";
      tr.innerHTML = `
        <span>Total</span>
        <span>${this._fmt(this._data.total)}</span>
      `;
      list.appendChild(tr);
    }

    backdrop.removeAttribute("hidden");
    backdrop.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => backdrop.classList.add("open"));

    // Focus trap — move focus into modal
    const closeBtn = s.querySelector(".modal-close");
    closeBtn.focus();
    this._trapFocus(s.querySelector(".modal-dialog"));
  }

  _closeModal() {
    const backdrop = this._shadow.querySelector(".modal-backdrop");
    backdrop.classList.remove("open");
    backdrop.setAttribute("aria-hidden", "true");
    const onEnd = () => {
      backdrop.setAttribute("hidden", "");
      backdrop.removeEventListener("transitionend", onEnd);
    };
    backdrop.addEventListener("transitionend", onEnd);

    // Return focus to summary button
    this._shadow.querySelector(".summary-btn").focus();
    if (this._focusTrapHandler) {
      this._shadow
        .querySelector(".modal-dialog")
        .removeEventListener("keydown", this._focusTrapHandler);
    }
  }

  _trapFocus(el) {
    const focusable = () =>
      [
        ...el.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((n) => !n.disabled && !n.closest("[hidden]"));

    this._focusTrapHandler = (e) => {
      if (e.key !== "Tab") return;
      const nodes = focusable();
      if (!nodes.length) {
        e.preventDefault();
        return;
      }
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    el.addEventListener("keydown", this._focusTrapHandler);
  }

  _esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ─── HTML Template ──────────────────────────────────────────── */

  _html() {
    const { items, total } = this._data;
    const isEmpty = items === 0;
    return `
      <div class="bar at-bottom" role="complementary" aria-label="Checkout bar">
        <button
          class="summary-btn"
          aria-haspopup="dialog"
          aria-label="View cart contents"
        >
          <span class="summary-text">${this._summaryText()}</span>
          <span class="item-count" aria-hidden="true"${isEmpty ? " hidden" : ""}>${isEmpty ? "" : items}</span>
        </button>

        <button
          class="checkout-btn"
          aria-label="Proceed to checkout"
          ${isEmpty ? "disabled" : ""}
        >
          Checkout <span class="arrow" aria-hidden="true">→</span>
        </button>
      </div>

      <!-- Modal -->
      <div
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Cart details"
        aria-hidden="true"
        hidden
      >
        <div class="modal-dialog">
          <header class="modal-header">
            <h2 class="modal-title">Your Cart</h2>
            <button class="modal-close" aria-label="Close cart">✕</button>
          </header>
          <ul class="cart-list" role="list"></ul>
        </div>
      </div>
    `;
  }

  /* ─── CSS ────────────────────────────────────────────────────── */

  _css() {
    return `
      :host {
        --cb-bg:        #0f0f0f;
        --cb-surface:   #1a1a1a;
        --cb-accent:    #f5a623;
        --cb-accent-dk: #c7841a;
        --cb-text:      #e8e8e8;
        --cb-muted:     #888;
        --cb-border:    #2a2a2a;
        --cb-height:    64px;
        --cb-font:      'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
        --cb-radius:    4px;
        --cb-z:         1000;
        --cb-shadow:    0 -4px 24px rgba(0,0,0,.6);
        --cb-shadow-t:  0  4px 24px rgba(0,0,0,.6);

        display: block;
        font-family: var(--cb-font);
      }

      /* ── Bar ── */
      .bar {
        position: fixed;
        left: 0;
        right: 0;
        height: var(--cb-height);
        z-index: var(--cb-z);
        background: var(--cb-bg);
        border-top: 1px solid var(--cb-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 clamp(16px, 4vw, 48px);
        gap: 12px;
        transition:
          top    .35s cubic-bezier(.4,0,.2,1),
          bottom .35s cubic-bezier(.4,0,.2,1),
          box-shadow .35s ease;
        will-change: top, bottom;
        /* Subtle noise texture overlay */
        background-image:
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 1px,
            rgba(255,255,255,.012) 1px,
            rgba(255,255,255,.012) 2px
          );
      }

      .bar.at-top {
        top: 0;
        bottom: auto;
        border-top: none;
        border-bottom: 1px solid var(--cb-border);
        box-shadow: var(--cb-shadow-t);
      }

      .bar.at-bottom {
        bottom: 0;
        top: auto;
        border-top: 1px solid var(--cb-border);
        border-bottom: none;
        box-shadow: var(--cb-shadow);
      }

      /* ── Summary Button ── */
      .summary-btn {
        flex: 1;
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 0;
        font-family: var(--cb-font);
        color: var(--cb-text);
        font-size: clamp(.78rem, 2vw, .9rem);
        letter-spacing: .03em;
        text-align: left;
        transition: color .2s;
        min-width: 0;
      }

      .summary-btn:hover { color: var(--cb-accent); }

      .summary-btn:focus-visible {
        outline: 2px solid var(--cb-accent);
        outline-offset: 3px;
        border-radius: var(--cb-radius);
      }

      .summary-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ── Item Count Pill ── */
      .item-count {
        background: var(--cb-accent);
        color: #000;
        font-size: .65rem;
        font-weight: 700;
        border-radius: 999px;
        min-width: 20px;
        height: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 6px;
        flex-shrink: 0;
        animation: pip-pop .25s cubic-bezier(.34,1.56,.64,1);
      }

      @keyframes pip-pop {
        from { transform: scale(0); }
        to   { transform: scale(1); }
      }

      /* ── Checkout Button ── */
      .checkout-btn {
        flex-shrink: 0;
        background: var(--cb-accent);
        color: #000;
        border: none;
        border-radius: var(--cb-radius);
        font-family: var(--cb-font);
        font-size: clamp(.78rem, 2vw, .88rem);
        font-weight: 700;
        letter-spacing: .06em;
        text-transform: uppercase;
        padding: 0 clamp(16px, 3vw, 28px);
        height: 40px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: background .2s, transform .12s;
        position: relative;
        overflow: hidden;
      }

      .checkout-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(255,255,255,.15);
        transform: translateX(-110%) skewX(-20deg);
        transition: transform .4s ease;
      }

      .checkout-btn:hover:not(:disabled)::before {
        transform: translateX(110%) skewX(-20deg);
      }

      .checkout-btn:hover:not(:disabled) {
        background: var(--cb-accent-dk);
      }

      .checkout-btn:active:not(:disabled) {
        transform: scale(.97);
      }

      .checkout-btn:focus-visible {
        outline: 2px solid var(--cb-accent);
        outline-offset: 3px;
      }

      .checkout-btn:disabled {
        opacity: .35;
        cursor: not-allowed;
      }

      .arrow {
        display: inline-block;
        transition: transform .2s;
      }

      .checkout-btn:hover:not(:disabled) .arrow {
        transform: translateX(4px);
      }

      /* ── Modal Backdrop ── */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: calc(var(--cb-z) + 1);
        background: rgba(0,0,0,.75);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        opacity: 0;
        transition: opacity .25s ease;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        pointer-events:none;
      }

      .modal-backdrop.open {
        opacity: 1;
        pointer-events:auto;
      }

      /* ── Modal Dialog ── */
      .modal-dialog {
        background: var(--cb-surface);
        border: 1px solid var(--cb-border);
        border-bottom: none;
        border-radius: 8px 8px 0 0;
        width: 100%;
        max-width: 560px;
        max-height: 70vh;
        display: flex;
        flex-direction: column;
        transform: translateY(24px);
        transition: transform .3s cubic-bezier(.4,0,.2,1);
        box-shadow: 0 -8px 40px rgba(0,0,0,.6);
        overflow: hidden;
      }

      .modal-backdrop.open .modal-dialog {
        transform: translateY(0);
      }

      /* ── Modal Header ── */
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 24px;
        border-bottom: 1px solid var(--cb-border);
        flex-shrink: 0;
      }

      .modal-title {
        margin: 0;
        font-family: var(--cb-font);
        font-size: .95rem;
        font-weight: 700;
        color: var(--cb-text);
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .modal-close {
        background: none;
        border: 1px solid var(--cb-border);
        border-radius: var(--cb-radius);
        color: var(--cb-muted);
        font-size: .85rem;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: color .2s, border-color .2s, background .2s;
      }

      .modal-close:hover {
        color: var(--cb-text);
        border-color: var(--cb-text);
        background: rgba(255,255,255,.05);
      }

      .modal-close:focus-visible {
        outline: 2px solid var(--cb-accent);
        outline-offset: 2px;
      }

      /* ── Cart List ── */
      .cart-list {
        list-style: none;
        margin: 0;
        padding: 12px 0;
        overflow-y: auto;
        flex: 1;
        /* Custom scrollbar */
        scrollbar-width: thin;
        scrollbar-color: var(--cb-border) transparent;
      }

      .cart-list::-webkit-scrollbar { width: 4px; }
      .cart-list::-webkit-scrollbar-track { background: transparent; }
      .cart-list::-webkit-scrollbar-thumb { background: var(--cb-border); border-radius: 2px; }

      .cart-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 24px;
        gap: 12px;
        border-bottom: 1px solid rgba(255,255,255,.04);
        animation: slide-in .2s ease both;
      }

      .cart-item:last-of-type { border-bottom: none; }

      @keyframes slide-in {
        from { opacity: 0; transform: translateX(-8px); }
        to   { opacity: 1; transform: translateX(0); }
      }

      .ci-name {
        color: var(--cb-text);
        font-size: .82rem;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ci-price {
        color: var(--cb-accent);
        font-size: .82rem;
        font-weight: 700;
        flex-shrink: 0;
      }

      .cart-total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 24px;
        margin-top: 4px;
        border-top: 1px solid var(--cb-border);
        font-size: .88rem;
        font-weight: 700;
        color: var(--cb-text);
        letter-spacing: .05em;
        text-transform: uppercase;
      }

      .cart-total-row span:last-child {
        color: var(--cb-accent);
        font-size: 1rem;
      }

      .cart-empty {
        padding: 32px 24px;
        text-align: center;
        color: var(--cb-muted);
        font-size: .82rem;
        letter-spacing: .04em;
      }
    `;
  }
}

customElements.define("checkout-bar", CheckoutBar);
