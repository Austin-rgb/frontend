    /* ─────────────────────────────────────────────
       <product-list>
    ───────────────────────────────────────────── */
    class ProductList extends HTMLElement {
      connectedCallback() {
        this.attachShadow({ mode: 'open' });
        Store.subscribe(state => this._render(state));
      }

      _render(state) {
        const { products } = state;
        this.shadowRoot.innerHTML = `
      <style>
        ${baseStyles}
        :host { display: block; }
        .section-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #8a8070; margin-bottom: 16px;
        }
        table { width: 100%; border-collapse: collapse; }
        thead tr { border-bottom: 2px solid #0d0d0d; }
        th {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #8a8070; padding: 0 0 12px; text-align: left;
        }
        th:last-child { text-align: right; }
        th.center { text-align: center; }
        tbody tr {
          border-bottom: 1px solid #d4cfc4;
          transition: background .15s;
        }
        tbody tr:hover { background: #ede9df; }
        td { padding: 16px 0; vertical-align: middle; }
        .prod-name {
          font-weight: 700; font-size: 15px;
          letter-spacing: -0.01em; color: #0d0d0d;
        }
        .prod-price {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px; color: #8a8070;
        }
        .qty-cell { text-align: center; }
        .qty-wrap {
          display: inline-flex; align-items: center;
          gap: 0; border: 1.5px solid #d4cfc4;
          border-radius: 4px; overflow: hidden;
        }
        .qty-btn {
          background: none; border: none; cursor: pointer;
          width: 32px; height: 32px;
          font-size: 16px; font-weight: 700; color: #0d0d0d;
          display: flex; align-items: center; justify-content: center;
          transition: background .15s;
        }
        .qty-btn:hover { background: #ede9df; }
        .qty-input {
          width: 40px; height: 32px; border: none;
          border-left: 1.5px solid #d4cfc4;
          border-right: 1.5px solid #d4cfc4;
          text-align: center; font-family: 'JetBrains Mono', monospace;
          font-size: 13px; font-weight: 500; background: #fff;
          color: #0d0d0d; outline: none;
        }
        .qty-input:focus { background: #f5f2eb; }
        .total-cell {
          text-align: right;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px; font-weight: 500; color: #0d0d0d;
        }
        .zero { color: #c9c3b8; }
      </style>
      <p class="section-label">Your Items</p>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Unit Price</th>
            <th class="center">Qty</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(p => `
            <tr>
              <td class="prod-name">${p.name}</td>
              <td class="prod-price">${fmt(p.price)}</td>
              <td class="qty-cell">
                <div class="qty-wrap">
                  <button class="qty-btn" data-id="${p.id}" data-action="dec">−</button>
                  <input class="qty-input" type="number" min="0" value="${p.quantity}" data-id="${p.id}" />
                  <button class="qty-btn" data-id="${p.id}" data-action="inc">+</button>
                </div>
              </td>
              <td class="total-cell ${p.quantity === 0 ? 'zero' : ''}">${fmt(p.price * p.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

        this.shadowRoot.querySelectorAll('.qty-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = +btn.dataset.id;
            const state = Store.getState();
            const prod = state.products.find(p => p.id === id);
            if (!prod) return;
            const delta = btn.dataset.action === 'inc' ? 1 : -1;
            Store.setQuantity(id, prod.quantity + delta);
          });
        });

        this.shadowRoot.querySelectorAll('.qty-input').forEach(input => {
          input.addEventListener('change', () => {
            Store.setQuantity(+input.dataset.id, parseInt(input.value) || 0);
          });
        });
      }
    }
    customElements.define('product-list', ProductList);
