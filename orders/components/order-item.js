import { formatCurrency } from "../utils/formatters.js";

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
    }

    .item {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto;
      column-gap: 1rem;
      row-gap: 0.2rem;
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--border-subtle, rgba(0,0,0,0.06));
      animation: slideIn 0.25s ease both;
      animation-delay: var(--item-delay, 0ms);
      opacity: 0;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .item__name {
      font-family: var(--font-body, sans-serif);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text-primary, #1a1a2e);
      line-height: 1.3;
      grid-column: 1;
      grid-row: 1;
    }

    .item__meta {
      font-family: var(--font-mono, monospace);
      font-size: 0.72rem;
      color: var(--color-text-muted, #888);
      letter-spacing: 0.03em;
      grid-column: 1;
      grid-row: 2;
    }

    .item__total {
      font-family: var(--font-mono, monospace);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-primary, #1a1a2e);
      text-align: right;
      grid-column: 2;
      grid-row: 1 / 3;
      align-self: center;
    }
  </style>
  <div class="item" role="listitem">
    <span class="item__name"></span>
    <span class="item__meta"></span>
    <span class="item__total"></span>
  </div>
`;

export class OrderItem extends HTMLElement {
  static get observedAttributes() {
    return ["name", "price", "quantity"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));

    this._nameEl = this.shadowRoot.querySelector(".item__name");
    this._metaEl = this.shadowRoot.querySelector(".item__meta");
    this._totalEl = this.shadowRoot.querySelector(".item__total");
  }

  attributeChangedCallback() {
    this._render();
  }

  connectedCallback() {
    this._render();
  }

  _render() {
    const name = this.getAttribute("name") ?? "Unknown item";
    const price = parseFloat(this.getAttribute("price") ?? "0");
    const quantity = parseInt(this.getAttribute("quantity") ?? "1", 10);
    const lineTotal = price * quantity;

    this._nameEl.textContent = name;
    this._metaEl.textContent = `${formatCurrency(price)} × ${quantity}`;
    this._totalEl.textContent = formatCurrency(lineTotal);
  }
}

customElements.define("order-item", OrderItem);

