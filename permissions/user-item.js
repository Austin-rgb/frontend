//   <!-- ═══════════════════════════════════
//      <forge-user-item>
// ═══════════════════════════════════ -->

class ForgeUserItem extends HTMLElement {
  static get observedAttributes() {
    return [
      "user-id",
      "user-name",
      "user-role",
      "user-color",
      "perm-count",
      "selected",
    ];
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

  async _render() {
    const id = this.getAttribute("user-id");
    const name = this.getAttribute("user-name") || "";
    const role = this.getAttribute("user-role") || "";
    const cidx = parseInt(this.getAttribute("user-color") || "0");
    const count = this.getAttribute("perm-count") || "0";
    const sel = this.getAttribute("selected") === "true";
    const [bg, fg] = (await AppStore).AVATAR_COLORS[cidx] || ["#444", "#fff"];
    const init = name
      .split(" ")
      .map((n) => n[0])
      .join("");

    this._s.innerHTML = `
      <style>
        .item {
          display:flex; align-items:center; gap:12px; padding:11px 20px; cursor:pointer;
          transition:background 0.15s;
          border-left:3px solid ${sel ? "#7c5cfc" : "transparent"};
          background:${sel ? "rgba(124,92,252,0.1)" : "transparent"};
        }
        .item:hover { background:rgba(124,92,252,0.06); }
        .av {
          width:34px; height:34px; border-radius:8px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          font-family:'Syne',sans-serif; font-weight:700; font-size:13px;
          background:${bg}; color:${fg};
        }
        .inf { flex:1; min-width:0; }
        .nm  { font-family:'Syne',sans-serif; font-size:13px; font-weight:600; color:#e8e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rl  { font-family:'DM Mono',monospace; font-size:10px; color:#6b6b88; margin-top:1px; }
        .ct  { font-family:'DM Mono',monospace; font-size:10px; background:#1a1a24; border:1px solid #2a2a3a; border-radius:20px; padding:2px 8px; color:#6b6b88; }
      </style>
      <div class="item">
        <div class="av">${init}</div>
        <div class="inf"><div class="nm">${name}</div><div class="rl">${role}</div></div>
        <span class="ct">${count}</span>
      </div>`;

    this._s.querySelector(".item").addEventListener("click", () =>
      this.dispatchEvent(
        new CustomEvent("user-select", {
          detail: { userId: parseInt(id) },
          bubbles: true,
          composed: true,
        }),
      ),
    );
  }
}
customElements.define("forge-user-item", ForgeUserItem);
