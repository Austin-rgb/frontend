//   <!-- ═══════════════════════════════════
//      <forge-detail-panel>
// ═══════════════════════════════════ -->

class ForgeDetailPanel extends HTMLElement {
  constructor() {
    super();
    this._s = this.attachShadow({ mode: "open" });
    this._userId = null;
    this._onUS = ({ userId }) => {
      this._userId = userId;
      this._render();
    };
    this._onPC = ({ userId }) => {
      if (userId === this._userId) this._render();
    };
  }
  connectedCallback() {
    this._s.innerHTML = `
      <style>
        :host {
          display:block; border-left:1px solid #2a2a3a; background:rgba(17,17,24,0.6);
          padding:28px 24px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:#2a2a3a transparent;
        }
        :host::-webkit-scrollbar{width:4px}
        :host::-webkit-scrollbar-thumb{background:#2a2a3a;border-radius:2px}
        .empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:80vh; color:#6b6b88; text-align:center; padding:40px; }
        .ei { font-size:48px; margin-bottom:16px; opacity:0.4; }
        .et { font-family:'Syne',sans-serif; font-size:14px; line-height:1.6; }
        .content { display:none; }
        .content.on { display:block; }
        .card { background:#1a1a24; border:1px solid #2a2a3a; border-radius:16px; padding:24px; margin-bottom:24px; text-align:center; }
        .av { width:64px; height:64px; border-radius:16px; display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:24px; font-weight:800; margin:0 auto 14px; }
        .dn  { font-family:'Syne',sans-serif; font-size:18px; font-weight:800; letter-spacing:-0.5px; color:#e8e8f0; }
        .dem { font-family:'DM Mono',monospace; font-size:12px; color:#6b6b88; margin-top:3px; }
        .drl { display:inline-block; margin-top:10px; padding:4px 14px; border-radius:20px; font-family:'DM Mono',monospace; font-size:11px; }
        .stl { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:2px; color:#6b6b88; text-transform:uppercase; margin-bottom:12px; }
        .bdg { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:20px; }
        .b { font-family:'DM Mono',monospace; font-size:10px; padding:4px 10px; border-radius:4px; letter-spacing:0.5px; }
        .b.g { background:rgba(0,229,176,0.1); border:1px solid rgba(0,229,176,0.2); color:#00e5b0; }
        .b.d { background:rgba(255,75,110,0.1); border:1px solid rgba(255,75,110,0.2); color:#ff4b6e; }
        .ai { display:flex; gap:10px; margin-bottom:14px; }
        .dot { width:8px; height:8px; border-radius:50%; margin-top:4px; flex-shrink:0; }
        .at { font-family:'DM Mono',monospace; font-size:11px; color:#6b6b88; line-height:1.5; }
        .at strong { color:#e8e8f0; font-weight:500; }
        .nn { font-family:'DM Mono',monospace; font-size:11px; color:#6b6b88; }
      </style>
      <div class="empty" id="emp"><div class="ei">🛡️</div><div class="et">User details and<br>activity will appear here</div></div>
      <div class="content" id="cnt">
        <div class="card">
          <div class="av"  id="av"></div>
          <div class="dn"  id="dn"></div>
          <div class="dem" id="dem"></div>
          <span class="drl" id="drl"></span>
        </div>
        <div class="stl">Active Permissions</div>
        <div class="bdg" id="bdg"></div>
        <div class="stl">Recent Activity</div>
        <div id="act"></div>
      </div>`;
    AppStore.on("user-selected", this._onUS);
    AppStore.on("perm-changed", this._onPC);
  }
  disconnectedCallback() {
    AppStore.off("user-selected", this._onUS);
    AppStore.off("perm-changed", this._onPC);
  }
  async _render() {
    let appStore = await AppStore;
    const user = appStore.USERS.find((u) => u.id === this._userId);
    if (!user) return;
    this._s.getElementById("emp").style.display = "none";
    this._s.getElementById("cnt").classList.add("on");
    const [bg, fg] = appStore.AVATAR_COLORS[user.color];
    const avEl = this._s.getElementById("av");
    avEl.textContent = user.name
      .split(" ")
      .map((n) => n[0])
      .join("");
    avEl.style.background = bg;
    avEl.style.color = fg;
    this._s.getElementById("dn").textContent = user.name;
    this._s.getElementById("dem").textContent = user.email;
    const rl = this._s.getElementById("drl");
    rl.textContent = user.role;
    rl.style.background = bg + "44";
    rl.style.color = fg;
    rl.style.border = `1px solid ${bg}66`;

    const all = appStore.PERMISSION_GROUPS.flatMap((g) => g.permissions);
    const gl = all.filter((p) => user.perms[p.id]);
    const dl = all.filter((p) => !user.perms[p.id]);
    const bdg = this._s.getElementById("bdg");
    if (!gl.length && !dl.length) {
      bdg.innerHTML = '<span class="nn">No permissions assigned</span>';
    } else {
      bdg.innerHTML =
        gl.map((p) => `<span class="b g">${p.name}</span>`).join("") +
        dl
          .slice(0, 4)
          .map((p) => `<span class="b d">${p.name}</span>`)
          .join("") +
        (dl.length > 4
          ? `<span class="b d">+${dl.length - 4} denied</span>`
          : "");
    }
    const logs = appStore.ACTIVITY[user.id] || [];
    const actEl = this._s.getElementById("act");
    actEl.innerHTML = !logs.length
      ? '<span class="nn">No recent activity</span>'
      : logs
          .map(
            (l) => `
          <div class="ai">
            <div class="dot" style="background:${l.type === "grant" ? "#00e5b0" : "#ff4b6e"}"></div>
            <div class="at"><strong>${l.type === "grant" ? "Granted" : "Denied"}</strong> ${l.perm}<br>Today at ${l.time}</div>
          </div>`,
          )
          .join("");
  }
}
customElements.define("forge-detail-panel", ForgeDetailPanel);
