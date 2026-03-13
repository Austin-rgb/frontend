//   <!-- ═══════════════════════════════════
//      <forge-perm-group>
// ═══════════════════════════════════ -->

class ForgePermGroup extends HTMLElement {
  static get observedAttributes() {
    return [
      "group-id",
      "group-name",
      "group-icon",
      "group-color",
      "user-id",
      "filter",
    ];
  }
  constructor() {
    super();
    this._s = this.attachShadow({ mode: "open" });
    this._open = true;
    this._onPC = ({ userId }) => {
      if (userId === parseInt(this.getAttribute("user-id")))
        this._refreshRows();
    };
  }
  connectedCallback() {
    this._render();
    AppStore.on("perm-changed", this._onPC);
  }
  disconnectedCallback() {
    AppStore.off("perm-changed", this._onPC);
  }
  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }

  _render() {
    const id = this.getAttribute("group-id");
    const name = this.getAttribute("group-name") || "";
    const icon = this.getAttribute("group-icon") || "";
    const color = this.getAttribute("group-color") || "#7c5cfc";
    const userId = parseInt(this.getAttribute("user-id"));
    const user = AppStore.USERS.find((u) => u.id === userId);
    const grp = AppStore.PERMISSION_GROUPS.find((g) => g.id === id);
    if (!grp || !user) return;
    const gc = grp.permissions.filter((p) => user.perms[p.id]).length;

    this._s.innerHTML = `
      <style>
        .grp { background:#111118; border:1px solid #2a2a3a; border-radius:12px; margin-bottom:16px; overflow:hidden; }
        .hdr {
          display:flex; align-items:center; justify-content:space-between;
          padding:16px 20px; cursor:pointer; border-bottom:1px solid transparent; transition:background 0.15s;
        }
        .hdr:hover { background:rgba(124,92,252,0.04); }
        .grp.op .hdr { border-bottom-color:#2a2a3a; }
        .gt { display:flex; align-items:center; gap:10px; font-family:'Syne',sans-serif; font-weight:700; font-size:14px; color:#e8e8f0; }
        .gi { width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:14px; background:${color}22; color:${color}; }
        .meta { display:flex; align-items:center; gap:10px; }
        .sum { font-family:'DM Mono',monospace; font-size:11px; color:#6b6b88; }
        .chv { color:#6b6b88; transition:transform 0.2s; font-size:12px; }
        .grp.op .chv { transform:rotate(180deg); }
        .rows { display:none; }
        .grp.op .rows { display:block; }
      </style>
      <div class="grp ${this._open ? "op" : ""}" id="g">
        <div class="hdr" id="h">
          <div class="gt"><div class="gi">${icon}</div>${name}</div>
          <div class="meta">
            <span class="sum" id="sum">${gc}/${grp.permissions.length} granted</span>
            <span class="chv">▼</span>
          </div>
        </div>
        <div class="rows" id="rows"></div>
      </div>`;

    this._s.getElementById("h").addEventListener("click", () => {
      this._open = !this._open;
      this._s.getElementById("g").classList.toggle("op", this._open);
    });
    this._refreshRows();
  }
  _refreshRows() {
    const id = this.getAttribute("group-id");
    const userId = parseInt(this.getAttribute("user-id"));
    const filter = this.getAttribute("filter") || "all";
    const user = AppStore.USERS.find((u) => u.id === userId);
    const grp = AppStore.PERMISSION_GROUPS.find((g) => g.id === id);
    const rows = this._s.getElementById("rows");
    if (!grp || !user || !rows) return;
    rows.innerHTML = "";

    grp.permissions
      .filter((p) => {
        if (filter === "granted") return !!user.perms[p.id];
        if (filter === "denied") return !user.perms[p.id];
        return true;
      })
      .forEach((p) => {
        const el = document.createElement("forge-perm-row");
        el.setAttribute("perm-id", p.id);
        el.setAttribute("perm-name", p.name);
        el.setAttribute("perm-desc", p.desc);
        el.setAttribute("user-id", userId);
        el.setAttribute("granted", user.perms[p.id] ? "true" : "false");
        rows.appendChild(el);
      });

    const sum = this._s.getElementById("sum");
    if (sum)
      sum.textContent = `${grp.permissions.filter((p) => user.perms[p.id]).length}/${grp.permissions.length} granted`;
  }
}
customElements.define("forge-perm-group", ForgePermGroup);
