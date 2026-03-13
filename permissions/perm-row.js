//   <!-- ═══════════════════════════════════
//      <forge-perm-row>
// ═══════════════════════════════════ -->

class ForgePermRow extends HTMLElement {
  static get observedAttributes() {
    return ["perm-id", "perm-name", "perm-desc", "user-id", "granted"];
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
    const pid = this.getAttribute("perm-id") || "";
    const name = this.getAttribute("perm-name") || "";
    const desc = this.getAttribute("perm-desc") || "";
    const userId = parseInt(this.getAttribute("user-id"));
    const granted = this.getAttribute("granted") === "true";

    this._s.innerHTML = `
      <style>
        .row {
          display:flex; align-items:center; padding:13px 20px;
          border-bottom:1px solid rgba(42,42,58,0.5); gap:14px; transition:background 0.15s;
        }
        .row:hover { background:rgba(124,92,252,0.03); }
        .inf { flex:1; }
        .nm  { font-family:'Syne',sans-serif; font-size:13px; font-weight:600; color:#e8e8f0; }
        .dc  { font-family:'DM Mono',monospace; font-size:11px; color:#6b6b88; margin-top:2px; }
        .act { display:flex; gap:6px; }
        button {
          padding:6px 14px; border-radius:6px; font-family:'DM Mono',monospace;
          font-size:11px; cursor:pointer; border:1px solid transparent; transition:all 0.15s; letter-spacing:0.5px;
        }
        .gr { background:rgba(0,229,176,0.1); border-color:rgba(0,229,176,0.3); color:#00e5b0; }
        .gr.on,.gr:hover { background:#00e5b0; border-color:#00e5b0; color:#0a0a0f; box-shadow:0 0 12px rgba(0,229,176,0.3); }
        .dn { background:rgba(255,75,110,0.1); border-color:rgba(255,75,110,0.3); color:#ff4b6e; }
        .dn.on,.dn:hover { background:#ff4b6e; border-color:#ff4b6e; color:white; box-shadow:0 0 12px rgba(255,75,110,0.3); }
      </style>
      <div class="row">
        <div class="inf"><div class="nm">${name}</div><div class="dc">${desc}</div></div>
        <div class="act">
          <button class="gr ${granted ? "on" : ""}"  id="gb">GRANT</button>
          <button class="dn ${!granted ? "on" : ""}" id="db">DENY</button>
        </div>
      </div>`;

    this._s.getElementById("gb").addEventListener("click", () => {
      AppStore.setPerm(userId, pid, true);
      AppStore.emit("toast", { type: "granted", perm: name });
    });
    this._s.getElementById("db").addEventListener("click", () => {
      AppStore.setPerm(userId, pid, false);
      AppStore.emit("toast", { type: "denied", perm: name });
    });
  }
}
customElements.define("forge-perm-row", ForgePermRow);
