/* ─────────────────────────────────────────────
       STORE
    ───────────────────────────────────────────── */
const Store = (async () => {
  let items = await (await fetch("/api/cart/get")).json();
  let products = [];
  let total = 0;
  for (item of items) {
    let product = await (
      await fetch("/api/catalog/products/" + item.product)
    ).json();
    total += product.price;
    product.quantity = item.qty;
    products.push(product);
  }
  let res = undefined;
  try {
    res = await fetch("/api/auth/me/account");
  } catch {
    console.log("connecting as guest");
  }
  let user = await res.json();
  const _state = {
    step: "cart", // cart | form | verify | payment
    products,
    token: null,
    user: { name: user?.user_id, email: user?.email },
  };

  // Attempt to restore cart from localStorage
  try {
    const saved = localStorage.getItem("checkout_cart");
    if (saved) {
      const parsed = JSON.parse(saved);
      _state.products = parsed;
    }
  } catch {}

  const _listeners = [];

  function _notify() {
    _listeners.forEach((fn) =>
      fn({ ..._state, products: [..._state.products.map((p) => ({ ...p }))] }),
    );
  }

  function saveCart() {
    try {
      localStorage.setItem("checkout_cart", JSON.stringify(_state.products));
    } catch {}
  }

  return {
    getState: () => ({
      ..._state,
      products: _state.products.map((p) => ({ ...p })),
    }),

    subscribe(fn) {
      _listeners.push(fn);
      fn(store.getState());
    },

    setQuantity(id, qty) {
      const p = _state.products.find((p) => p.id === id);
      if (p) {
        p.quantity = Math.max(0, qty);
        _notify();
        saveCart();
      }
    },

    setStep(step) {
      _state.step = step;
      _notify();
    },

    setToken(token) {
      _state.token = token;
      _notify();
    },

    setUser(user) {
      _state.user = { ...user };
      fetch("/api/auth/passwordless/register/start", {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      _notify();
    },

    getTotal() {
      return _state.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    },
  };
})();

let store = undefined;

/* ─────────────────────────────────────────────
       <app-root>
    ───────────────────────────────────────────── */
class AppRoot extends HTMLElement {
  async connectedCallback() {
    if (!store) store = await Store;
    this.attachShadow({ mode: "open" });
    this._render(store.getState());
    store.subscribe((state) => this._render(state));
  }

  _render(state) {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: flex; flex-direction: column; align-items: center; width: 100%; }
        .header {
          width: 100%;
          max-width: 760px;
          display: flex;
          align-items: baseline;
          gap: 12px;
          padding: 36px 0 28px;
          border-bottom: 2px solid #0d0d0d;
          margin-bottom: 40px;
        }
        .header h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(28px, 5vw, 42px);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #0d0d0d;
          line-height: 1;
        }
        .header .dot { color: #c84b2f; font-size: 1em; }
        .step-bar {
          width: 100%;
          max-width: 760px;
          display: flex;
          align-items: center;
          gap: 0;
          margin-bottom: 40px;
        }
        .step {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8a8070;
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        .step .num {
          width: 24px; height: 24px;
          border-radius: 50%;
          border: 1.5px solid #d4cfc4;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; color: #8a8070; flex-shrink: 0;
          transition: all .25s ease;
        }
        .step.active .num { background: #0d0d0d; border-color: #0d0d0d; color: #f5f2eb; }
        .step.done .num { background: #c84b2f; border-color: #c84b2f; color: #fff; }
        .step.active { color: #0d0d0d; }
        .step.done { color: #c84b2f; }
        .step-line { flex: 1; height: 1.5px; background: #d4cfc4; max-width: 40px; }
        .step-line.done { background: #c84b2f; }
        .main { width: 100%; max-width: 760px; }
      </style>
      <div class="header">
        <h1>Checkout<span class="dot">.</span></h1>
      </div>
      ${this._stepBar(state.step)}
      <div class="main">
        ${this._currentStep(state.step)}
      </div>
    `;

    // Attach step components
    const main = this.shadowRoot.querySelector(".main");
    const steps = {
      cart: "cart-view",
      form: "user-form",
      verify: "token-verification",
      payment: "payment-page",
    };
    const tag = steps[state.step];
    if (tag) {
      const el = document.createElement(tag);
      main.innerHTML = "";
      main.appendChild(el);
    }
  }

  _stepBar(step) {
    const steps = [
      { key: "cart", label: "Cart" },
      { key: "form", label: "Details" },
      { key: "verify", label: "Verify" },
      { key: "payment", label: "Payment" },
    ];
    const idx = steps.findIndex((s) => s.key === step);
    return `<div class="step-bar">${steps
      .map((s, i) => {
        const cls = i < idx ? "done" : i === idx ? "active" : "";
        const check = i < idx ? "✓" : i + 1;
        return `
        ${i > 0 ? `<div class="step-line ${i <= idx ? "done" : ""}"></div>` : ""}
        <div class="step ${cls}">
          <span class="num">${check}</span>
          ${s.label}
        </div>`;
      })
      .join("")}</div>`;
  }

  _currentStep() {
    return "";
  }
}
customElements.define("app-root", AppRoot);
