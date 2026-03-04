import "./order-item.js";
import { formatCurrency, formatDate, pluralise, computeOrderTotal } from "../utils/formatters.js";

/** @type {Record<string, { label: string; colorVar: string }>} */
const STATUS_CONFIG = {
  completed:  { label: "Completed",  colorVar: "status-completed" },
  processing: { label: "Processing", colorVar: "status-processing" },
  pending:    { label: "Pending",    colorVar: "status-pending" },
  cancelled:  { label: "Cancelled",  colorVar: "status-cancelled" },
};

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :host {
      display: block;
      --dur: 0.32s;
      --ease: cubic-bezier(0.4, 0, 0.2, 1);
    }

    .card {
      background: var(--color-card-bg, #ffffff);
      border-radius: var(--radius-card, 16px);
      border: 1px solid var(--border-card, rgba(0,0,0,0.08));
      box-shadow: var(--shadow-card, 0 2px 8px rgba(0,0,0,0.06));
      overflow: hidden;
      transition: box-shadow var(--dur) var(--ease),
                  transform var(--dur) var(--ease);
    }

    @media (hover: hover) {
      .card:hover {
        box-shadow: var(--shadow-card-hover, 0 8px 24px rgba(0,0,0,0.12));
        transform: translateY(-2px);
      }
    }

    /* ── Summary row (always visible) ── */
    .summary {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto;
      align-items: center;
      gap: 0.25rem 1rem;
      padding: 1.1rem 1.25rem;
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      position: relative;
      min-height: 4rem;
    }

    .summary:focus-visible {
      outline: 3px solid var(--color-accent, #3b82f6);
      outline-offset: -3px;
      border-radius: var(--radius-card, 16px) var(--radius-card, 16px) 0 0;
    }

    .summary__top {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
      grid-column: 1;
      grid-row: 1;
    }

    .summary__id {
      font-family: var(--font-mono, monospace);
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--color-text-primary, #1a1a2e);
      letter-spacing: 0.04em;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-family: var(--font-body, sans-serif);
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 0.2em 0.65em;
      border-radius: 999px;
      line-height: 1.6;
    }

    .status-badge::before {
      content: "";
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      flex-shrink: 0;
    }

    .status--completed  { color: var(--status-completed-fg, #166534);  background: var(--status-completed-bg, #dcfce7); }
    .status--processing { color: var(--status-processing-fg, #92400e); background: var(--status-processing-bg, #fef3c7); }
    .status--pending    { color: var(--status-pending-fg, #1e40af);    background: var(--status-pending-bg, #dbeafe); }
    .status--cancelled  { color: var(--status-cancelled-fg, #991b1b);  background: var(--status-cancelled-bg, #fee2e2); }

    .summary__sub {
      grid-column: 1;
      grid-row: 2;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .summary__meta {
      font-family: var(--font-body, sans-serif);
      font-size: 0.8rem;
      color: var(--color-text-muted, #888);
    }

    .summary__price {
      font-family: var(--font-mono, monospace);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-secondary, #444);
    }

    /* ── Chevron ── */
    .chevron {
      grid-column: 2;
      grid-row: 1 / 3;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: var(--color-chevron-bg, rgba(0,0,0,0.04));
      transition: background var(--dur) var(--ease),
                  transform var(--dur) var(--ease);
      flex-shrink: 0;
    }

    .chevron svg {
      width: 14px;
      height: 14px;
      stroke: var(--color-text-muted, #888);
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
      transition: stroke var(--dur) var(--ease);
    }

    /* ── Items panel ── */
    .items-panel {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows var(--dur) var(--ease);
    }

    .items-panel[aria-hidden="false"] {
      grid-template-rows: 1fr;
    }

    .items-inner {
      overflow: hidden;
    }

    .items-list {
      border-top: 1px solid var(--border-card, rgba(0,0,0,0.08));
      background: var(--color-items-bg, rgba(0,0,0,0.018));
    }

    /* Active / expanded state */
    :host([expanded]) .chevron {
      transform: rotate(180deg);
      background: var(--color-accent-subtle, rgba(59,130,246,0.1));
    }

    :host([expanded]) .chevron svg {
      stroke: var(--color-accent, #3b82f6);
    }
  </style>

  <article class="card">
    <div class="summary"
         role="button"
         tabindex="0"
         aria-expanded="false"
         aria-controls="items-panel">
      <div class="summary__top">
        <span class="summary__id"></span>
        <span class="status-badge" role="status" aria-label="Order status"></span>
      </div>
      <div class="summary__sub">
        <span class="summary__meta date"></span>
        <span class="summary__meta count"></span>
        <span class="summary__price total"></span>
      </div>
      <div class="chevron" aria-hidden="true">
        <svg viewBox="0 0 16 16">
          <polyline points="3,6 8,11 13,6"/>
        </svg>
      </div>
    </div>

    <div class="items-panel"
         id="items-panel"
         role="list"
         aria-label="Order items"
         aria-hidden="true">
      <div class="items-inner">
        <div class="items-list"></div>
      </div>
    </div>
  </article>
`;

export class OrderCard extends HTMLElement {
  /** @type {import('../data/orders.js').Order|null} */
  #order = null;
  #expanded = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));

    this._summary    = this.shadowRoot.querySelector(".summary");
    this._idEl       = this.shadowRoot.querySelector(".summary__id");
    this._badgeEl    = this.shadowRoot.querySelector(".status-badge");
    this._dateEl     = this.shadowRoot.querySelector(".date");
    this._countEl    = this.shadowRoot.querySelector(".count");
    this._totalEl    = this.shadowRoot.querySelector(".total");
    this._panel      = this.shadowRoot.querySelector(".items-panel");
    this._itemsList  = this.shadowRoot.querySelector(".items-list");

    this._onToggle   = this._onToggle.bind(this);
    this._onKeydown  = this._onKeydown.bind(this);
  }

  connectedCallback() {
    this._summary.addEventListener("click",   this._onToggle);
    this._summary.addEventListener("keydown",  this._onKeydown);
  }

  disconnectedCallback() {
    this._summary.removeEventListener("click",   this._onToggle);
    this._summary.removeEventListener("keydown",  this._onKeydown);
  }

  /**
   * Set the order data and render the card.
   * @param {import('../data/orders.js').Order} order
   */
  setOrder(order) {
    this.#order = order;
    this._renderSummary();
    this._renderItems();
  }

  _renderSummary() {
    const { id, date, status, items } = this.#order;
    const total = computeOrderTotal(items);
    const config = STATUS_CONFIG[status] ?? { label: status, colorVar: "status-pending" };

    this._idEl.textContent = id;

    this._badgeEl.textContent = config.label;
    this._badgeEl.className = `status-badge status--${status}`;
    this._badgeEl.setAttribute("aria-label", `Order status: ${config.label}`);

    this._dateEl.textContent = formatDate(date);
    this._countEl.textContent = pluralise(items.length, "item");
    this._totalEl.textContent = formatCurrency(total);

    this._summary.setAttribute("aria-label",
      `Order ${id}, ${config.label}, ${formatDate(date)}, ${pluralise(items.length, "item")}, ${formatCurrency(total)}`
    );
  }

  _renderItems() {
    this._itemsList.replaceChildren(); // clear

    this.#order.items.forEach((item, index) => {
      const el = document.createElement("order-item");
      el.setAttribute("name",     item.name);
      el.setAttribute("price",    String(item.price));
      el.setAttribute("quantity", String(item.quantity));
      el.style.setProperty("--item-delay", `${index * 40}ms`);
      this._itemsList.appendChild(el);
    });
  }

  _onToggle() {
    this.#expanded = !this.#expanded;
    this._applyExpanded();
  }

  _onKeydown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this._onToggle();
    }
  }

  _applyExpanded() {
    const expanded = this.#expanded;
    this._summary.setAttribute("aria-expanded", String(expanded));
    this._panel.setAttribute("aria-hidden", String(!expanded));

    if (expanded) {
      this.setAttribute("expanded", "");
    } else {
      this.removeAttribute("expanded");
    }
  }
}

customElements.define("order-card", OrderCard);

