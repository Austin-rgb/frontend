/* ─────────────────────────────────────────────
   <payment-page>
───────────────────────────────────────────── */
class PaymentPage extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    Store.subscribe((state) => this._render(state));
  }

  _render(state) {
    const total = Store.getTotal();
    const items = state.products.filter((p) => p.quantity > 0);

    this.shadowRoot.innerHTML = `
      <style>
        
        :host { display: block; }
        .card {
          background: #fff; border: 1.5px solid #d4cfc4;
          border-radius: 8px; overflow: hidden;
        }
        .card-head {
          background: #0d0d0d; color: #f5f2eb;
          padding: 32px 40px;
        }
        .card-head .label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
          color: #8a8070; margin-bottom: 8px;
        }
        .card-head .user-name { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
        .card-head .user-email {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px; color: #8a8070;
        }
        .card-body { padding: 32px 40px; }
        .items-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
          color: #8a8070; margin-bottom: 16px;
        }
        .item-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0; border-bottom: 1px solid #ede9df;
          font-size: 14px;
        }
        .item-row:last-of-type { border-bottom: none; }
        .item-name { font-weight: 600; color: #0d0d0d; }
        .item-meta {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: #8a8070; margin-top: 2px;
        }
        .item-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px; font-weight: 500; color: #0d0d0d;
        }
        .divider { height: 1.5px; background: #0d0d0d; margin: 20px 0; }
        .total-row {
          display: flex; justify-content: space-between; align-items: baseline;
        }
        .total-label { font-size: 14px; font-weight: 600; color: #0d0d0d; }
        .total-amount {
          font-size: 36px; font-weight: 800;
          letter-spacing: -0.03em; color: #0d0d0d;
        }
        .pay-btn {
          margin-top: 28px; width: 100%;
          font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800;
          background: #c84b2f; color: #fff;
          border: none; border-radius: 6px; padding: 18px;
          cursor: pointer; letter-spacing: 0.01em;
          transition: background .2s, transform .1s;
        }
        .pay-btn:hover { background: #e8604a; transform: translateY(-1px); }
        .pay-btn:active { transform: translateY(0); }
        .secure-note {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: #8a8070; text-align: center; margin-top: 14px;
        }
        /* Success overlay */
        .success-overlay {
          position: fixed; inset: 0;
          background: rgba(13,13,13,0.85);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; opacity: 0;
          transition: opacity .3s; pointer-events: none;
        }
        .success-overlay.show { opacity: 1; pointer-events: auto; }
        .success-box {
          background: #f5f2eb; border-radius: 8px;
          padding: 48px 56px; text-align: center;
          transform: scale(0.9); transition: transform .3s;
        }
        .success-overlay.show .success-box { transform: scale(1); }
        .success-icon { font-size: 48px; margin-bottom: 16px; }
        .success-title { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 8px; }
        .success-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px; color: #8a8070;
        }
        .success-total {
          font-size: 40px; font-weight: 800; color: #c84b2f;
          letter-spacing: -0.03em; margin: 20px 0 8px;
        }
      </style>
      <div class="card">
        <div class="card-head">
          <div class="label">Payment Summary</div>
          <div class="user-name">${state.user.name || "Customer"}</div>
          <div class="user-email">${state.user.email || ""}</div>
        </div>
        <div class="card-body">
          <div class="items-label">Order Items</div>
          ${items
            .map(
              (p) => `
            <div class="item-row">
              <div>
                <div class="item-name">${p.name}</div>
                <div class="item-meta">${fmt(p.price)} × ${p.quantity}</div>
              </div>
              <div class="item-sub">${fmt(p.price * p.quantity)}</div>
            </div>
          `,
            )
            .join("")}
          <div class="divider"></div>
          <div class="total-row">
            <div class="total-label">Total Due</div>
            <div class="total-amount">${fmt(total)}</div>
          </div>
          <button class="pay-btn" id="pay-btn">Proceed to Payment →</button>
          <div class="secure-note">🔒 Secured with 256-bit SSL encryption</div>
        </div>
      </div>
      <div class="success-overlay" id="success-overlay">
        <div class="success-box">
          <div class="success-icon">✓</div>
          <div class="success-title">Payment Complete</div>
          <div class="success-total">${fmt(total)}</div>
          <div class="success-sub">Thank you, ${state.user.name || "Customer"}!<br/>A receipt has been sent to ${state.user.email || "your email"}.</div>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById("pay-btn").addEventListener("click", () => {
      const overlay = this.shadowRoot.getElementById("success-overlay");
      overlay.classList.add("show");
      // Clear cart
      state.products.forEach((p) => Store.setQuantity(p.id, 0));
      try {
        localStorage.removeItem("checkout_cart");
      } catch {}
    });
  }
}
customElements.define("payment-page", PaymentPage);
