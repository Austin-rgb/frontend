//   <!-- ═══════════════════════════════════
//      <forge-user-sidebar>
// ═══════════════════════════════════ -->

class UserSearch extends HTMLElement {
  constructor() {
    super();
    this._s = this.attachShadow({ mode: "open" });
    this._username = "";
  }

  connectedCallback() {
    this._s.innerHTML = `
    <div>
    <input type="text" placeholder="username" id="username">
    <button id="search" >Search</button>
    </div>
    `;
    let username_input = this._s.getElementById("username");
    username_input.addEventListener("input", (e) => {
      console.log("inputting");
      if (search_button.innerText == "Search") return;
      search_button.innerText = "Search";
      //search_button.removeEventListener("click");
      search_button.addEventListener("click", search);
    });
    let search_button = this._s.getElementById("search");
    search_button.addEventListener("click", (e) => {
      console.log("trying to search");
      let username = username_input.value;
      fetch("/api/auth/user_id/username/" + username).then((res) => {
        if (res.status != 200) {
          search_button.textContent = "Not Found";
          return;
        }
        search_button.textContent = "Add User";
        //search_button.removeEventListener("click");
        search_button.addEventListener("click", (e) => add_user(username));
      });
    });

    let add_user = (username) => {
      appStore.USERS.push({
        id: appStore.USERS.length + 1,
        name: username,
        email: "no email",
        role: "General",
        color: 0,
        perms: {},
      });
      appStore.emit("user-added");
    };
  }
}

customElements.define("user-search", UserSearch);

class ForgeUserSidebar extends HTMLElement {
  constructor() {
    super();
    this._s = this.attachShadow({ mode: "open" });
    this._selectedId = null;
    this._onPermChanged = ({ userId }) => this._refreshCount(userId);
    this._total_users = 0;
  }
  async connectedCallback() {
    if (!appStore) appStore = await AppStore;
    this._s.innerHTML = `
      <style>
        :host {
          display:block; border-right:1px solid #2a2a3a; padding:24px 0;
          overflow-y:auto; background:rgba(17,17,24,0.6);
          scrollbar-width:thin; scrollbar-color:#2a2a3a transparent;
        }
        :host::-webkit-scrollbar{width:4px}
        :host::-webkit-scrollbar-thumb{background:#2a2a3a;border-radius:2px}
        .sec { margin-bottom:32px; }
        .lbl {
          display:block; font-family:'DM Mono',monospace; font-size:10px;
          letter-spacing:2px; color:#6b6b88; text-transform:uppercase; padding:0 20px 10px;
        }
        .sw { padding:0 16px 12px; }
        input {
          width:100%; background:#1a1a24; border:1px solid #2a2a3a; border-radius:8px;
          padding:9px 12px 9px 36px; color:#e8e8f0;
          font-family:'DM Mono',monospace; font-size:13px; outline:none; transition:border-color 0.2s;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b6b88' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:11px center;
        }
        input:focus{border-color:#7c5cfc}
        input::placeholder{color:#6b6b88}
      </style>
      <div class="sec">
        <span class="lbl">Search Users</span>
        <div class="sw"><input type="text" placeholder="Search by name or role…" id="q"></div>
      </div>
      <div class="sec">
        <span class="lbl" id="lbl">Users (${appStore.USERS.length})</span>
        <user-search></user-search>
        <div id="list"></div>
      </div>
      `;

    this._s
      .getElementById("q")
      .addEventListener("input", (e) => this._filter(e.target.value));
    this._render(appStore.USERS);
    appStore.on("perm-changed", this._onPermChanged);
    appStore.on("user-added", (e) => this._render(appStore.USERS));

    /* bubble user-select up through shadow roots */
    this._s.getElementById("list").addEventListener("user-select", (e) => {
      this._selectedId = e.detail.userId;
      this._s
        .querySelectorAll("forge-user-item")
        .forEach((el) =>
          el.setAttribute(
            "selected",
            el.getAttribute("user-id") == this._selectedId ? "true" : "false",
          ),
        );
      appStore.emit("user-selected", { userId: this._selectedId });
    });
  }
  disconnectedCallback() {
    appStore.off("perm-changed", this._onPermChanged);
    appStore.off("user-added");
  }

  _render(users) {
    const list = this._s.getElementById("list");
    list.innerHTML = "";
    users.forEach((u) => {
      const el = document.createElement("forge-user-item");
      el.setAttribute("user-id", u.id);
      el.setAttribute("user-name", u.name);
      el.setAttribute("user-role", u.role);
      el.setAttribute("user-color", u.color);
      el.setAttribute("perm-count", Object.keys(u.perms).length);
      el.setAttribute("selected", u.id === this._selectedId ? "true" : "false");
      list.appendChild(el);
    });
  }
  _filter(q) {
    const f = appStore.USERS.filter(
      (u) =>
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.role.toLowerCase().includes(q.toLowerCase()),
    );
    this._s.getElementById("lbl").textContent = `Users (${f.length})`;
    this._render(f);
  }
  async _refreshCount(userId) {
    const el = this._s.querySelector(`forge-user-item[user-id="${userId}"]`);
    if (el)
      el.setAttribute(
        "perm-count",
        Object.keys(appStore.USERS.find((u) => u.id === userId).perms).length,
      );
  }
}
customElements.define("forge-user-sidebar", ForgeUserSidebar);
