//   <!-- ═══════════════════════════════════
//      <forge-perm-panel>
// ═══════════════════════════════════ -->

class ForgePermPanel extends HTMLElement {
  constructor() {
    super();
    this._s = this.attachShadow({ mode: "open" });
    this._userId = null;
    this._filter = "all";
    this._onUserSelected = ({ userId }) => {
      this._userId = userId;
      this._refresh();
    };
    this._onPermChanged = ({ userId }) => {
      if (userId === this._userId) this._refresh();
    };
  }
  async connectedCallback() {
    if (!appStore) appStore = await AppStore;

    this._s.innerHTML = `
      <style>
        :host { display:block; padding:32px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:#2a2a3a transparent; }
        :host::-webkit-scrollbar{width:4px}
        :host::-webkit-scrollbar-thumb{background:#2a2a3a;border-radius:2px}
        .empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:80vh; color:#6b6b88; text-align:center; padding:40px; }
        .ei { font-size:48px; margin-bottom:16px; opacity:0.4; }
        .et { font-family:'Syne',sans-serif; font-size:14px; line-height:1.6; }
        .content { display:none; }
        .content.on { display:block; }
        .top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:28px; }
        h1 { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; letter-spacing:-0.5px; color:#e8e8f0; }
        .sub { font-family:'DM Mono',monospace; font-size:12px; color:#6b6b88; margin-top:4px; }
        .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:28px; }
        .chips { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; }
        .chip {
          font-family:'DM Mono',monospace; font-size:11px; padding:5px 12px;
          border-radius:20px; border:1px solid #2a2a3a; background:transparent;
          color:#6b6b88; cursor:pointer; transition:all 0.15s;
        }
        .chip:hover,.chip.on { border-color:#7c5cfc; color:#7c5cfc; background:rgba(124,92,252,0.08); }
        .bulk {
          display:flex; gap:8px; margin-bottom:20px; padding:14px 16px;
          background:#111118; border:1px solid #2a2a3a; border-radius:10px; align-items:center;
        }
        .blbl { font-family:'DM Mono',monospace; font-size:11px; color:#6b6b88; flex:1; }
        .bb {
          padding:7px 14px; border-radius:6px; font-family:'DM Mono',monospace;
          font-size:11px; font-weight:500; cursor:pointer; border:1px solid transparent;
          transition:all 0.15s; letter-spacing:0.5px;
        }
        .bg { background:rgba(0,229,176,0.12); border-color:rgba(0,229,176,0.25); color:#00e5b0; }
        .bg:hover { background:#00e5b0; color:#0a0a0f; }
        .bd { background:rgba(255,75,110,0.12); border-color:rgba(255,75,110,0.25); color:#ff4b6e; }
        .bd:hover { background:#ff4b6e; color:white; }
      </style>
      <div class="empty" id="emp">
        <div class="ei">👤</div>
        <div class="et">Select a user from the sidebar<br>to manage their permissions</div>
      </div>
      <div class="content" id="cnt">
        <div class="top"><div><h1 id="ttl"></h1><div class="sub" id="sub"></div></div></div>
        <div class="stats">
          <forge-stat-card id="sg" variant="green"  label="GRANTED"></forge-stat-card>
          <forge-stat-card id="sd" variant="red"    label="DENIED"></forge-stat-card>
          <forge-stat-card id="st" variant="purple" label="TOTAL PERMS"></forge-stat-card>
        </div>
        <div class="chips">
          <button class="chip on" data-f="all">All</button>
          <button class="chip" data-f="granted">Granted only</button>
          <button class="chip" data-f="denied">Denied only</button>
        </div>
        <div class="bulk">
          <span class="blbl">Bulk operations for this user:</span>
          <button class="bb bg" id="bga">✓ Grant All</button>
          <button class="bb bd" id="bda">✕ Deny All</button>
        </div>
        <div id="grps"></div>
      </div>`;

    this._s.querySelector(".chips").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      this._filter = chip.dataset.f;
      this._s
        .querySelectorAll(".chip")
        .forEach((c) => c.classList.remove("on"));
      chip.classList.add("on");
      this._renderGroups();
    });
    this._s.getElementById("bga").addEventListener("click", () => {
      if (!this._userId) return;
      appStore.bulkSetPerms(this._userId, true);
      appStore.emit("toast", { type: "granted", perm: "All permissions" });
    });
    this._s.getElementById("bda").addEventListener("click", () => {
      if (!this._userId) return;
      appStore.bulkSetPerms(this._userId, false);
      appStore.emit("toast", { type: "denied", perm: "All permissions" });
    });

    appStore.on("user-selected", this._onUserSelected);
    appStore.on("perm-changed", this._onPermChanged);
  }
  async disconnectedCallback() {
    appStore.off("user-selected", this._onUserSelected);
    appStore.off("perm-changed", this._onPermChanged);
  }

  async _refresh() {
    if (!appStore) appStore = await AppStore;

    const user = appStore.USERS.find((u) => u.id === this._userId);
    if (!user) return;
    this._s.getElementById("emp").style.display = "none";
    this._s.getElementById("cnt").classList.add("on");
    this._s.getElementById("ttl").textContent = user.name;
    this._s.getElementById("sub").textContent = `${user.email} · ${user.role}`;
    const all = appStore.PERMISSION_GROUPS.flatMap((g) => g.permissions);
    const granted = all.filter((p) => user.perms[p.id]).length;
    this._s.getElementById("sg").setAttribute("value", granted);
    this._s.getElementById("sd").setAttribute("value", all.length - granted);
    this._s.getElementById("st").setAttribute("value", all.length);
    this._renderGroups();
  }
  _renderGroups() {
    const user = appStore.USERS.find((u) => u.id === this._userId);
    if (!user) return;
    const c = this._s.getElementById("grps");
    c.innerHTML = "";
    appStore.PERMISSION_GROUPS.forEach((g) => {
      const visible = g.permissions.filter((p) => {
        if (this._filter === "granted") return !!user.perms[p.id];
        if (this._filter === "denied") return !user.perms[p.id];
        return true;
      });
      if (!visible.length) return;
      const el = document.createElement("forge-perm-group");
      el.setAttribute("group-id", g.id);
      el.setAttribute("group-name", g.name);
      el.setAttribute("group-icon", g.icon);
      el.setAttribute("group-color", g.color);
      el.setAttribute("user-id", this._userId);
      el.setAttribute("filter", this._filter);
      c.appendChild(el);
    });
  }
}
customElements.define("forge-perm-panel", ForgePermPanel);

