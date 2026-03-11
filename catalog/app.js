/* ═══════════════════════════════════════════════
       UTILITIES
    ═══════════════════════════════════════════════ */
function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Shared event bus */
const Bus = new EventTarget();
const emit = (name, detail = {}) =>
  Bus.dispatchEvent(new CustomEvent(name, { detail }));

// API instance

const api = new ProductAPI({ baseURL: "/api/catalog" });

/* ═══════════════════════════════════════════════
       STORE  — reactive product list
    ═══════════════════════════════════════════════ */
let bootstrap = async () => {
  //let _list = JSON.parse(localStorage.getItem("fw_products") || "null");
  let _list = await api.listProducts();
  const _subs = new Set();

  if (!_list) {
    _list = [
      {
        id: uid(),
        name: "Waxed Canvas Tote",
        category: "Bags",
        sku: "FW-0001",
        description:
          "Durable waxed canvas carry-all with leather handles and a brass clasp closure.",
        price: 89.0,
        stock: 24,
        image:
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
      },
      {
        id: uid(),
        name: "Leather Field Journal",
        category: "Stationery",
        sku: "FW-0002",
        description:
          "Full-grain vegetable-tanned leather cover with 200 pages of dot-grid paper.",
        price: 48.5,
        stock: 6,
        image:
          "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&q=80",
      },
      {
        id: uid(),
        name: "Brass Compass",
        category: "Navigation",
        sku: "FW-0003",
        description:
          "Traditional fluid-filled baseplate compass with declination adjustment ring.",
        price: 34.0,
        stock: 0,
        image:
          "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80",
      },
      {
        id: uid(),
        name: "Merino Wool Socks",
        category: "Apparel",
        sku: "FW-0004",
        description:
          "Mid-weight merino blend, reinforced heel and toe. Available in sizes S–XL.",
        price: 18.0,
        stock: 52,
        image:
          "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600&q=80",
      },
      {
        id: uid(),
        name: "Titanium Spork",
        category: "Utensils",
        sku: "FW-0005",
        description:
          "Ultra-light grade 1 titanium spork with a matte brushed finish. Only 14 g.",
        price: 12.0,
        stock: 3,
        image: "",
      },
      {
        id: uid(),
        name: "Waterproof Gaiters",
        category: "Apparel",
        sku: "FW-0006",
        description:
          "Lightweight nylon gaiters with instep strap and hook-loop closure system.",
        price: 55.0,
        stock: 17,
        image:
          "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
      },
    ];
    _save();
  }

  function _save() {
    localStorage.setItem("fw_products", JSON.stringify(_list));
  }
  function _notify() {
    _subs.forEach((fn) => fn([..._list]));
  }

  return {
    subscribe(fn) {
      _subs.add(fn);
      fn([..._list]);
      return () => _subs.delete(fn);
    },
    getAll() {
      return [..._list];
    },
    categories() {
      return [...new Set(_list.map((p) => p.category).filter(Boolean))].sort();
    },
    add(d) {
      _list.unshift({ id: uid(), ...d });
      _save();
      _notify();
    },
    update(id, d) {
      const i = _list.findIndex((p) => p.id === id);
      if (i > -1) {
        _list[i] = { ..._list[i], ...d };
        _save();
        _notify();
      }
    },
    remove(id) {
      _list = _list.filter((p) => p.id !== id);
      _save();
      _notify();
    },
  };
};
let Store = bootstrap();

/* ═══════════════════════════════════════════════
       <app-header>
    ═══════════════════════════════════════════════ */
class AppHeader extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
    <style>
      :host{display:block;}
      header{
        position:sticky;top:0;z-index:100;background:#1a1714;
        height:64px;padding:0 2.5rem;
        display:flex;align-items:center;justify-content:space-between;
        border-bottom:2px solid #c8892a;
      }
      .logo{font-family:'DM Serif Display',serif;font-size:1.5rem;color:#f5f0e8;letter-spacing:.02em;}
      .logo em{color:#c8892a;font-style:italic;}
    </style>
    <header>
      <span class="logo">Field<em>work</em></span>
      <fw-button variant="ghost" id="btn">+ Add Product</fw-button>
    </header>`;
    this.shadowRoot
      .getElementById("btn")
      .addEventListener("click", () => emit("modal:open"));
  }
}
customElements.define("app-header", AppHeader);

/* ═══════════════════════════════════════════════
       <fw-button>  variant: primary|ghost|danger|outline
       Attribute: small (boolean)
    ═══════════════════════════════════════════════ */
class FwButton extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "small", "disabled"];
  }
  connectedCallback() {
    this._build();
  }
  attributeChangedCallback() {
    this._btn && this._style();
  }
  _build() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
    <style>
      :host{display:inline-block;}
      button{
        font-family:'Instrument Sans',sans-serif;font-size:.8125rem;font-weight:600;
        letter-spacing:.06em;text-transform:uppercase;
        border:1.5px solid currentColor;padding:.45rem 1.1rem;
        cursor:pointer;border-radius:2px;background:transparent;line-height:1;
        transition:background .15s,color .15s,border-color .15s,transform .1s;
      }
      button:active:not(:disabled){transform:scale(.97);}
      button:disabled{opacity:.4;cursor:not-allowed;}
      button.primary {background:#c8892a;border-color:#c8892a;color:#1a1714;}
      button.primary:hover:not(:disabled){background:#e8b05a;border-color:#e8b05a;}
      button.ghost   {color:#f5f0e8;border-color:#f5f0e8;}
      button.ghost:hover:not(:disabled){background:rgba(255,255,255,.08);}
      button.danger  {color:#b04a2a;border-color:#b04a2a;}
      button.danger:hover:not(:disabled){background:#b04a2a;color:#fff;}
      button.outline {color:#1a1714;border-color:#d4cbbf;background:#fdfaf5;}
      button.outline:hover:not(:disabled){border-color:#1a1714;}
      button.small   {font-size:.72rem;padding:.38rem .65rem;}
    </style>
    <button part="btn"><slot></slot></button>`;
    this._btn = this.shadowRoot.querySelector("button");
    this._style();
    /* re-emit click as composed so parent shadow-roots hear it */
    this._btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!this.hasAttribute("disabled"))
        this.dispatchEvent(
          new MouseEvent("click", { bubbles: true, composed: true }),
        );
    });
  }
  _style() {
    if (!this._btn) return;
    this._btn.className = this.getAttribute("variant") || "outline";
    if (this.hasAttribute("small")) this._btn.classList.add("small");
    this._btn.disabled = this.hasAttribute("disabled");
  }
}
customElements.define("fw-button", FwButton);

/* ═══════════════════════════════════════════════
       <catalog-toolbar>
    ═══════════════════════════════════════════════ */
class CatalogToolbar extends HTMLElement {
  async connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
    <style>
      :host{display:block;position:relative;z-index:1;}
      .bar{
        padding:1.25rem 2.5rem;background:#ede7d8;
        border-bottom:1px solid #d4cbbf;
        display:flex;align-items:center;gap:1rem;flex-wrap:wrap;
      }
      .sw{position:relative;flex:1;min-width:220px;max-width:380px;}
      .sw svg{position:absolute;left:.75rem;top:50%;transform:translateY(-50%);color:#8a7f72;pointer-events:none;}
      input{
        width:100%;padding:.55rem .75rem .55rem 2.25rem;
        font-family:'Instrument Sans',sans-serif;font-size:.875rem;
        background:#fdfaf5;border:1.5px solid #d4cbbf;border-radius:2px;
        color:#1a1714;outline:none;transition:border-color .15s;
      }
      input:focus{border-color:#c8892a;}
      input::placeholder{color:#8a7f72;}
      select{
        font-family:'DM Mono',monospace;font-size:.75rem;
        padding:.55rem .9rem;background:#fdfaf5;
        border:1.5px solid #d4cbbf;border-radius:2px;
        color:#1a1714;cursor:pointer;outline:none;transition:border-color .15s;
      }
      select:focus{border-color:#c8892a;}
      .count{margin-left:auto;font-family:'DM Mono',monospace;font-size:.72rem;color:#8a7f72;letter-spacing:.04em;}
      @media(max-width:600px){.bar{padding:1rem;}}
    </style>
    <div class="bar">
      <div class="sw">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" id="q" placeholder="Search products… (⌘K)"/>
      </div>
      <select id="cat"><option value="">All Categories</option></select>
      <select id="stk">
        <option value="">All Stock</option>
        <option value="in">In Stock</option>
        <option value="low">Low Stock</option>
        <option value="out">Out of Stock</option>
      </select>
      <span class="count" id="count">0 products</span>
      <fw-button variant="primary" id="addBtn">+ Add Product</fw-button>
    </div>`;

    const sr = this.shadowRoot;
    const q = sr.getElementById("q");
    const cat = sr.getElementById("cat");
    const stk = sr.getElementById("stk");
    const fire = () =>
      emit("filter", {
        query: q.value.toLowerCase(),
        category: cat.value,
        stock: stk.value,
      });

    q.addEventListener("input", fire);
    cat.addEventListener("change", fire);
    stk.addEventListener("change", fire);
    sr.getElementById("addBtn").addEventListener("click", () =>
      emit("modal:open"),
    );
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        q.focus();
      }
    });

    Store.then((store) => {
      store.subscribe((products) => {
        const cats = [
          ...new Set(products.map((p) => p.category).filter(Boolean)),
        ].sort();
        const cur = cat.value;
        cat.innerHTML = '<option value="">All Categories</option>';
        cats.forEach((c) => {
          const o = document.createElement("option");
          o.value = c;
          o.textContent = c;
          if (c === cur) o.selected = true;
          cat.appendChild(o);
        });
        fire();
      });
    });

    Bus.addEventListener("count", (e) => {
      const n = e.detail.n;
      sr.getElementById("count").textContent =
        `${n} product${n !== 1 ? "s" : ""}`;
    });
  }
}
customElements.define("catalog-toolbar", CatalogToolbar);

/* ═══════════════════════════════════════════════
       <empty-state>
    ═══════════════════════════════════════════════ */
class EmptyState extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
    <style>
      :host{display:block;grid-column:1/-1;text-align:center;padding:5rem 2rem;color:#8a7f72;}
      svg{opacity:.2;margin-bottom:1rem;}
      p{font-family:'DM Serif Display',serif;font-size:1.4rem;margin-bottom:.5rem;color:#1a1714;}
    </style>
    <svg width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
    <p>No products found</p>
    <span>Adjust your filters or add a new product</span>`;
  }
}
customElements.define("empty-state", EmptyState);

/* ═══════════════════════════════════════════════
       <product-card>
       Property: .product = { id, name, category, … }
    ═══════════════════════════════════════════════ */
class ProductCard extends HTMLElement {
  set product(p) {
    this._p = p;
    this._render();
  }
  connectedCallback() {
    this._render();
  }
  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._p;
    if (!p) return;
    const sc = p.stock === 0 ? "out" : p.stock <= 5 ? "low" : "in";
    const sl =
      p.stock === 0
        ? "Out of Stock"
        : p.stock <= 5
          ? `Low · ${p.stock}`
          : `In Stock · ${p.stock}`;
    this.shadowRoot.innerHTML = `
    <style>
      :host{
        display:flex;flex-direction:column;
        background:#fdfaf5;border:1px solid #d4cbbf;border-radius:3px;overflow:hidden;
        box-shadow:0 2px 8px rgba(26,23,20,.08),0 1px 2px rgba(26,23,20,.05);
        transition:box-shadow .2s,transform .2s;
        animation:cardIn .35s ease both;
      }
      :host(:hover){box-shadow:0 8px 32px rgba(26,23,20,.12),0 2px 8px rgba(26,23,20,.08);transform:translateY(-2px);}
      @keyframes cardIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
      .thumb{
        width:100%;aspect-ratio:4/3;overflow:hidden;background:#ede7d8;
        border-bottom:1px solid #d4cbbf;display:flex;align-items:center;justify-content:center;
      }
      img{width:100%;height:100%;object-fit:cover;display:block;}
      .ph{font-size:2.5rem;}
      .body{padding:1.1rem 1.2rem;flex:1;display:flex;flex-direction:column;gap:.35rem;}
      .cat{font-family:'DM Mono',monospace;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:#c8892a;}
      .name{font-family:'DM Serif Display',serif;font-size:1.1rem;line-height:1.3;color:#1a1714;}
      .desc{font-size:.8rem;color:#8a7f72;line-height:1.55;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
      .foot{padding:.75rem 1.2rem;border-top:1px solid #d4cbbf;display:flex;align-items:center;justify-content:space-between;}
      .price{font-family:'DM Mono',monospace;font-size:.95rem;font-weight:500;color:#1a1714;}
      .badge{font-family:'DM Mono',monospace;font-size:.68rem;letter-spacing:.06em;text-transform:uppercase;padding:.2rem .5rem;border-radius:2px;}
      .in {background:#e8f0e8;color:#5c7a5e;} .low{background:#fdf4e0;color:#b07a10;} .out{background:#fae8e4;color:#b04a2a;}
      .acts{padding:0 1.2rem 1rem;display:flex;gap:.5rem;}
      fw-button{flex:1;}
    </style>
    <div class="thumb">
      ${
        p.image
          ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.parentElement.innerHTML='<span class=\\'ph\\'>📦</span>'"/>`
          : `<span class="ph">📦</span>`
      }
    </div>
    <div class="body">
      <div class="cat">${esc(p.category || "—")}</div>
      <div class="name">${esc(p.name)}</div>
      <div class="desc">${esc(p.description || "No description provided.")}</div>
    </div>
    <div class="foot">
      <span class="price">$${Number(p.price).toFixed(2)}</span>
      <span class="badge ${sc}">${sl}</span>
    </div>
    <div class="acts">
      <fw-button variant="outline" small id="e">Edit</fw-button>
      <fw-button variant="danger"  small id="d">Delete</fw-button>
    </div>`;
    this.shadowRoot
      .getElementById("e")
      .addEventListener("click", () => emit("modal:open", { id: p.id }));
    this.shadowRoot
      .getElementById("d")
      .addEventListener("click", () =>
        emit("confirm:open", { id: p.id, name: p.name }),
      );
  }
}
customElements.define("product-card", ProductCard);

/* ═══════════════════════════════════════════════
   <catalog-grid>
═══════════════════════════════════════════════ */
class CatalogGrid extends HTMLElement {
  constructor() {
    super();
    this._f = { query: "", category: "", stock: "" };
  }
  async connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
    <style>
      :host{display:block;position:relative;z-index:1;}
      .grid{
        display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));
        gap:1.5rem;padding:2rem 2.5rem;
      }
      @media(max-width:600px){.grid{padding:1rem;gap:1rem;}}
    </style>
    <div class="grid" id="g"></div>`;

    Bus.addEventListener("filter", (e) => {
      this._f = e.detail;
      this._render();
    });
    Store.then((store) => {
      store.subscribe((list) => {
        this._list = list;
        this._render();
      });
      this._list = store.getAll();
    });

    this._render();
  }
  _render() {
    if (!this._list) return;
    const {
      query: q,
      category: c,
      stock: s,
    } = this._f || { query: "", category: "", stock: "" };
    const all = this._list || [];
    const filtered = all.filter((p) => {
      const qm =
        !q ||
        [p.name, p.category, p.sku, p.description].some((v) =>
          v?.toLowerCase().includes(q),
        );
      const cm = !c || p.category === c;
      const sm =
        !s ||
        (s === "out" && p.stock === 0) ||
        (s === "low" && p.stock > 0 && p.stock <= 5) ||
        (s === "in" && p.stock > 5);
      return qm && cm && sm;
    });
    emit("count", { n: filtered.length });
    const g = this.shadowRoot.getElementById("g");
    g.innerHTML = "";
    if (!filtered.length) {
      g.appendChild(document.createElement("empty-state"));
      return;
    }
    filtered.forEach((p, i) => {
      const card = document.createElement("product-card");
      card.product = p;
      card.style.animationDelay = `${i * 40}ms`;
      g.appendChild(card);
    });
  }
}
customElements.define("catalog-grid", CatalogGrid);

/* ═══════════════════════════════════════════════
       <fw-field>  — labelled form-field wrapper
       Attributes: label, required
    ═══════════════════════════════════════════════ */
class FwField extends HTMLElement {
  connectedCallback() {
    const lbl = this.getAttribute("label") || "";
    const req = this.hasAttribute("required");
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
    <style>
      :host{display:flex;flex-direction:column;gap:.35rem;}
      label{font-family:'DM Mono',monospace;font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:#8a7f72;}
      ::slotted(input),::slotted(textarea),::slotted(select){
        font-family:'Instrument Sans',sans-serif;font-size:.875rem;
        background:#fdfaf5;border:1.5px solid #d4cbbf;border-radius:2px;
        color:#1a1714;padding:.55rem .75rem;outline:none;
        transition:border-color .15s,box-shadow .15s;width:100%;
      }
      ::slotted(textarea){resize:vertical;min-height:80px;}
      ::slotted(input:focus),::slotted(textarea:focus),::slotted(select:focus){border-color:#c8892a;}
      ::slotted(input.err){border-color:#b04a2a!important;}
    </style>
    <label>${esc(lbl)}${req ? ' <span style="color:#b04a2a">*</span>' : ""}</label>
    <slot></slot>`;
  }
}
customElements.define("fw-field", FwField);

/* ═══════════════════════════════════════════════
       <product-modal>
    ═══════════════════════════════════════════════ */
class ProductModal extends HTMLElement {
  connectedCallback() {
    this._eid = null;
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
    <style>
      :host{display:block;}
      .ov{
        position:fixed;inset:0;z-index:200;
        background:rgba(26,23,20,.55);backdrop-filter:blur(3px);
        display:flex;align-items:center;justify-content:center;padding:1rem;
        opacity:0;pointer-events:none;transition:opacity .2s;
      }
      .ov.open{opacity:1;pointer-events:all;}
      .modal{
        background:#fdfaf5;border:1px solid #d4cbbf;border-radius:4px;
        box-shadow:0 8px 32px rgba(26,23,20,.12),0 2px 8px rgba(26,23,20,.08);
        width:100%;max-width:560px;max-height:90vh;overflow-y:auto;
        transform:translateY(16px) scale(.98);
        transition:transform .25s cubic-bezier(.34,1.56,.64,1);
      }
      .ov.open .modal{transform:none;}
      .mh{
        padding:1.4rem 1.6rem 1rem;border-bottom:1px solid #d4cbbf;
        display:flex;align-items:center;justify-content:space-between;
      }
      h2{font-family:'DM Serif Display',serif;font-size:1.35rem;color:#1a1714;}
      .xbtn{
        background:none;border:none;cursor:pointer;color:#8a7f72;
        border-radius:2px;padding:.25rem;display:flex;align-items:center;
        transition:color .15s;
      }
      .xbtn:hover{color:#1a1714;}
      .mb{padding:1.4rem 1.6rem;display:flex;flex-direction:column;gap:1rem;}
      .row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
      input,textarea{
        font-family:'Instrument Sans',sans-serif;font-size:.875rem;
        background:#fdfaf5;border:1.5px solid #d4cbbf;border-radius:2px;
        color:#1a1714;padding:.55rem .75rem;outline:none;
        transition:border-color .15s;width:100%;
      }
      input:focus,textarea:focus{border-color:#c8892a;}
      input::placeholder,textarea::placeholder{color:#8a7f72;}
      textarea{resize:vertical;min-height:80px;}
      input.err{border-color:#b04a2a;animation:shake .35s ease;}
      #prev{display:none;width:100%;max-height:180px;object-fit:cover;border-radius:2px;border:1px solid #d4cbbf;}
      .mf{
        padding:1rem 1.6rem 1.4rem;border-top:1px solid #d4cbbf;
        display:flex;justify-content:flex-end;gap:.75rem;
      }
      @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
      @media(max-width:500px){.row{grid-template-columns:1fr;}}
    </style>
    <div class="ov" id="ov">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="mh">
          <h2 id="title">New Product</h2>
          <button class="xbtn" id="x" aria-label="Close">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="mb">
          <fw-field label="Product Name" required>
            <input id="n"  type="text"   placeholder="e.g. Field Camera Strap"/>
          </fw-field>
          <div class="row">
            <fw-field label="Category" required>
              <input id="c"  type="text"   placeholder="e.g. Accessories" list="cl"/>
              <datalist id="cl"></datalist>
            </fw-field>
            <fw-field label="SKU">
              <input id="sk" type="text"   placeholder="e.g. FW-0042"/>
            </fw-field>
          </div>
          <fw-field label="Description">
            <textarea id="d" placeholder="Brief product description…"></textarea>
          </fw-field>
          <div class="row">
            <fw-field label="Price ($)" required>
              <input id="p"  type="number" placeholder="0.00" min="0" step="0.01"/>
            </fw-field>
            <fw-field label="Stock Qty" required>
              <input id="s"  type="number" placeholder="0"    min="0" step="1"/>
            </fw-field>
          </div>
          <fw-field label="Image URL">
            <input id="img" type="text"   placeholder="https://…"/>
          </fw-field>
          <img id="prev" alt="Preview"/>
        </div>
        <div class="mf">
          <fw-button variant="outline" id="cancel">Cancel</fw-button>
          <fw-button variant="primary" id="save">Save Product</fw-button>
        </div>
      </div>
    </div>`;

    const sr = this.shadowRoot;
    const $ = (id) => sr.getElementById(id);

    $("x").addEventListener("click", () => this._close());
    $("cancel").addEventListener("click", () => this._close());
    $("save").addEventListener("click", () => this._save());
    $("img").addEventListener("input", () => {
      const u = $("img").value.trim();
      const pv = $("prev");
      if (u) {
        pv.src = u;
        pv.style.display = "block";
      } else pv.style.display = "none";
    });
    $("ov").addEventListener("click", (e) => {
      if (e.target === $("ov")) this._close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this._close();
    });
    Bus.addEventListener("modal:open", (e) => this._open(e.detail?.id));

    Store.then((store) => {
      store.subscribe((list) => {
        const dl = $("cl");
        dl.innerHTML = "";
        [...new Set(list.map((p) => p.category).filter(Boolean))]
          .sort()
          .forEach((c) => {
            const o = document.createElement("option");
            o.value = c;
            dl.appendChild(o);
          });
      });
    });
  }

  _open(id) {
    const sr = this.shadowRoot;
    const $ = (i) => sr.getElementById(i);
    this._eid = id || null;
    const p = id ? Store.getAll().find((x) => x.id === id) : null;
    $("title").textContent = p ? "Edit Product" : "New Product";
    $("n").value = p?.name || "";
    $("c").value = p?.category || "";
    $("sk").value = p?.sku || "";
    $("d").value = p?.description || "";
    $("p").value = p?.price ?? "";
    $("s").value = p?.stock ?? "";
    $("img").value = p?.image || "";
    const pv = $("prev");
    if (p?.image) {
      pv.src = p.image;
      pv.style.display = "block";
    } else pv.style.display = "none";
    $("ov").classList.add("open");
    setTimeout(() => $("n").focus(), 60);
  }

  _close() {
    this.shadowRoot.getElementById("ov").classList.remove("open");
    this._eid = null;
  }

  _shake(id) {
    const el = this.shadowRoot.getElementById(id);
    el.classList.remove("err");
    void el.offsetWidth;
    el.classList.add("err");
    setTimeout(() => el.classList.remove("err"), 800);
  }

  _save() {
    const sr = this.shadowRoot;
    const $v = (id) => sr.getElementById(id).value;
    const name = $v("n").trim(),
      cat = $v("c").trim();
    const price = parseFloat($v("p")),
      stock = parseInt($v("s"), 10);
    if (!name) {
      this._shake("n");
      emit("toast", { msg: "Product name is required." });
      return;
    }
    if (!cat) {
      this._shake("c");
      emit("toast", { msg: "Category is required." });
      return;
    }
    if (isNaN(price) || price < 0) {
      this._shake("p");
      emit("toast", { msg: "Enter a valid price." });
      return;
    }
    if (isNaN(stock) || stock < 0) {
      this._shake("s");
      emit("toast", { msg: "Enter a valid stock quantity." });
      return;
    }
    const data = {
      name,
      category: cat,
      sku: $v("sk").trim(),
      description: $v("d").trim(),
      price,
      qty: stock,
      image: $v("img").trim(),
    };
    if (this._eid) {
      Store.update(this._eid, data);
      emit("toast", { msg: "Product updated." });
    } else {
      api.createProduct(data);
      emit("toast", { msg: "Product added." });
    }
    this._close();
  }
}
customElements.define("product-modal", ProductModal);

/* ═══════════════════════════════════════════════
       <confirm-dialog>
    ═══════════════════════════════════════════════ */
class ConfirmDialog extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
    <style>
      :host{display:block;}
      .ov{
        position:fixed;inset:0;z-index:300;background:rgba(26,23,20,.5);
        display:flex;align-items:center;justify-content:center;padding:1rem;
        opacity:0;pointer-events:none;transition:opacity .15s;
      }
      .ov.open{opacity:1;pointer-events:all;}
      .box{
        background:#fdfaf5;border:1px solid #d4cbbf;border-radius:4px;
        box-shadow:0 8px 32px rgba(26,23,20,.12);
        padding:1.8rem;max-width:360px;width:100%;text-align:center;
      }
      p{font-family:'DM Serif Display',serif;font-size:1.1rem;margin-bottom:.4rem;}
      span{font-size:.82rem;color:#8a7f72;}
      .pn{font-weight:600;color:#1a1714;}
      .acts{display:flex;gap:.75rem;justify-content:center;margin-top:1.4rem;}
    </style>
    <div class="ov" id="ov">
      <div class="box">
        <p>Delete product?</p>
        <span>Remove <span class="pn" id="pn"></span>? This can't be undone.</span>
        <div class="acts">
          <fw-button variant="outline" id="no">Cancel</fw-button>
          <fw-button variant="danger"  id="yes">Delete</fw-button>
        </div>
      </div>
    </div>`;
    const sr = this.shadowRoot;
    sr.getElementById("no").addEventListener("click", () => this._close());
    sr.getElementById("yes").addEventListener("click", () => {
      if (this._id) {
        Store.remove(this._id);
        emit("toast", { msg: "Product deleted." });
      }
      this._close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this._close();
    });
    Bus.addEventListener("confirm:open", (e) => {
      this._id = e.detail.id;
      sr.getElementById("pn").textContent = e.detail.name;
      sr.getElementById("ov").classList.add("open");
    });
  }
  _close() {
    this.shadowRoot.getElementById("ov").classList.remove("open");
    this._id = null;
  }
}
customElements.define("confirm-dialog", ConfirmDialog);

/* ═══════════════════════════════════════════════
       <toast-container>  &  <fw-toast>
    ═══════════════════════════════════════════════ */
class ToastContainer extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
    <style>
      :host{display:block;}
      .w{position:fixed;bottom:2rem;right:2rem;z-index:400;display:flex;flex-direction:column;gap:.5rem;pointer-events:none;}
    </style>
    <div class="w" id="w"></div>`;
    Bus.addEventListener("toast", (e) => {
      const t = document.createElement("fw-toast");
      t.setAttribute("message", e.detail.msg);
      this.shadowRoot.getElementById("w").appendChild(t);
    });
  }
}
customElements.define("toast-container", ToastContainer);

class FwToast extends HTMLElement {
  static get observedAttributes() {
    return ["message"];
  }
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
    <style>
      :host{display:block;}
      .t{
        font-family:'DM Mono',monospace;font-size:.78rem;
        background:#1a1714;color:#f5f0e8;
        padding:.65rem 1rem;border-radius:2px;border-left:3px solid #c8892a;
        box-shadow:0 8px 32px rgba(26,23,20,.12);
        animation:tIn .3s ease both;white-space:nowrap;
      }
      .t.out{animation:tOut .3s ease both;}
      @keyframes tIn {from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
      @keyframes tOut{from{opacity:1;transform:none}to{opacity:0;transform:translateX(16px)}}
    </style>
    <div class="t" id="t">${esc(this.getAttribute("message") || "")}</div>`;
    setTimeout(() => {
      this.shadowRoot.getElementById("t").classList.add("out");
      setTimeout(() => this.remove(), 320);
    }, 2500);
  }
}
customElements.define("fw-toast", FwToast);
