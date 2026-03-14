const api = new AuthzApiClient("/api/permissions");

let AppStore = (async () => {
  let data = await api.listPermissions();
  let perms = data.permissions.map((perm) => {
    return {
      id: "*." + perm.name,
      name: perm.name,
      description: "Perm description",
    };
  });
  let group = {
    id: "data",
    icon: "🗄️",
    name: "Data Access",
    color: "#7c5cfc",
    permissions: perms,
  };
  let groups = [group];

  return {
    AVATAR_COLORS: [
      ["#7c5cfc", "#e8e8f0"],
      ["#00e5b0", "#0a0a0f"],
      ["#ff4b6e", "#e8e8f0"],
      ["#f5a623", "#0a0a0f"],
      ["#4facfe", "#0a0a0f"],
      ["#a18cd1", "#e8e8f0"],
      ["#fda085", "#0a0a0f"],
      ["#43e97b", "#0a0a0f"],
    ],
    USERS: [
      {
        id: 1,
        name: "Alice Martin",
        email: "alice@acme.co",
        role: "Engineering Lead",
        color: 0,
        perms: {
          "data.read": true,
          "data.write": true,
          "data.export": true,
          "users.view": true,
          "system.logs": true,
          "reports.view": true,
          "reports.create": true,
        },
      },
    ],
    PERMISSION_GROUPS: groups,
    ACTIVITY: {},

    /* ── pub/sub ── */
    _listeners: {},
    on(ev, fn) {
      (this._listeners[ev] ??= []).push(fn);
    },
    off(ev, fn) {
      if (fn)
        this._listeners[ev] = (this._listeners[ev] || []).filter(
          (f) => f !== fn,
        );
      else this._listeners.pop(ev);
    },
    /**
     * Emit event to the listeners
     */
    emit(ev, detail) {
      (this._listeners[ev] || []).forEach((fn) => fn(detail));
    },

    /* ── mutations ── */
    setPerm(userId, permId, grant) {
      const user = this.USERS.find((u) => u.id === userId);
      if (!user) return;
      if (grant) user.perms[permId] = true;
      else delete user.perms[permId];
      const perm = this.PERMISSION_GROUPS.flatMap((g) => g.permissions).find(
        (p) => p.id === permId,
      );
      this._log(userId, grant ? "grant" : "deny", perm.name);
      this.emit("perm-changed", { userId, permId, grant, user });
    },
    bulkSetPerms(userId, grant) {
      const user = this.USERS.find((u) => u.id === userId);
      if (!user) return;
      this.PERMISSION_GROUPS.flatMap((g) => g.permissions).forEach((p) => {
        if (grant) user.perms[p.id] = true;
        else delete user.perms[p.id];
      });
      this._log(userId, grant ? "grant" : "deny", "All permissions");
      this.emit("perm-changed", { userId, grant, bulk: true, user });
    },
    _log(userId, type, perm) {
      if (!this.ACTIVITY[userId]) this.ACTIVITY[userId] = [];
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      this.ACTIVITY[userId].unshift({ type, perm, time });
      if (this.ACTIVITY[userId].length > 8) this.ACTIVITY[userId].pop();
    },
  };
})();
AppStore.then((_appStore) => {
  appStore = _appStore;
  appStore.USERS.forEach((u) => {
    appStore.ACTIVITY[u.id] = [];
  });
});

let appStore = undefined;
