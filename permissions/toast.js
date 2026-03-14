//   <!-- ═══════════════════════════════════
//      <forge-toast-host>  +  <forge-toast>
// ═══════════════════════════════════ -->

class ForgeToastHost extends HTMLElement {
  constructor() {
    super();
    this._s = this.attachShadow({ mode: "open" });
    this._onToast = ({ type, perm }) => this._show(type, perm);
  }
  async connectedCallback() {
    if (!appStore) appStore = await AppStore;

    this._s.innerHTML = `
      <style>
        :host {
          position:fixed; bottom:30px; right:30px; z-index:1000;
          display:flex; flex-direction:column; gap:8px; align-items:flex-end; pointer-events:none;
        }
        forge-toast { pointer-events:auto; }
      </style>`;
    appStore.on("toast", this._onToast);
  }
  disconnectedCallback() {
    appStore.off("toast", this._onToast);
  }
  _show(type, perm) {
    const t = document.createElement("forge-toast");
    t.setAttribute("type", type);
    t.setAttribute("perm", perm);
    this._s.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }
}
customElements.define("forge-toast-host", ForgeToastHost);

class ForgeToast extends HTMLElement {
  static get observedAttributes() {
    return ["type", "perm"];
  }
  constructor() {
    super();
    this._s = this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }
  _render() {
    const type = this.getAttribute("type") || "granted";
    const perm = this.getAttribute("perm") || "";
    const c = type === "granted" ? "#00e5b0" : "#ff4b6e";
    const bc =
      type === "granted" ? "rgba(0,229,176,0.3)" : "rgba(255,75,110,0.3)";
    const icon = type === "granted" ? "✓" : "✕";
    const label = type === "granted" ? "Granted" : "Denied";
    this._s.innerHTML = `
      <style>
        .t {
          display:flex; align-items:center; gap:10px;
          background:#1a1a24; border:1px solid ${bc}; border-radius:10px;
          padding:12px 18px; box-shadow:0 8px 32px rgba(0,0,0,0.4); min-width:260px;
          animation:si 0.3s ease; font-family:'Syne',sans-serif;
        }
        .i { color:${c}; font-size:16px; font-weight:bold; }
        .m { font-size:13px; color:#e8e8f0; }
        .l { color:${c}; font-weight:700; }
        @keyframes si { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
      </style>
      <div class="t">
        <span class="i">${icon}</span>
        <span class="m"><span class="l">${label}</span>: ${perm}</span>
      </div>`;
  }
}
customElements.define("forge-toast", ForgeToast);
