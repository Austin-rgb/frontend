//   <!-- ═══════════════════════════════════
//      <forge-stat-card>
// ═══════════════════════════════════ -->

class ForgeStatCard extends HTMLElement {
  static get observedAttributes() {
    return ["value", "label", "variant"];
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
    const val = this.getAttribute("value") || "0";
    const label = this.getAttribute("label") || "";
    const variant = this.getAttribute("variant") || "purple";
    const c =
      { green: "#00e5b0", red: "#ff4b6e", purple: "#7c5cfc" }[variant] ||
      "#7c5cfc";
    this._s.innerHTML = `
      <style>
        .card {
          background:#111118; border:1px solid #2a2a3a; border-radius:12px;
          padding:18px 20px; position:relative; overflow:hidden;
        }
        .card::before { content:''; position:absolute; top:0;left:0;right:0; height:2px; background:${c}; }
        .v { font-family:'Syne',sans-serif; font-size:32px; font-weight:800; letter-spacing:-1px; line-height:1; color:${c}; }
        .l { font-family:'DM Mono',monospace; font-size:11px; color:#6b6b88; margin-top:6px; letter-spacing:0.5px; }
      </style>
      <div class="card"><div class="v">${val}</div><div class="l">${label}</div></div>`;
  }
}
customElements.define("forge-stat-card", ForgeStatCard);
