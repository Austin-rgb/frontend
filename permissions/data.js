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
    // PERMISSION_GROUPS: [
    //   {
    //     id: "data",
    //     icon: "🗄️",
    //     name: "Data Access",
    //     color: "#7c5cfc",
    //     permissions: [
    //       {
    //         id: "data.read",
    //         name: "Read Data",
    //         desc: "View records and reports",
    //       },
    //       {
    //         id: "data.write",
    //         name: "Write Data",
    //         desc: "Create and update records",
    //       },
    //       {
    //         id: "data.delete",
    //         name: "Delete Data",
    //         desc: "Permanently remove records",
    //       },
    //       {
    //         id: "data.export",
    //         name: "Export Data",
    //         desc: "Download data in bulk",
    //       },
    //     ],
    //   },
    //   {
    //     id: "users",
    //     icon: "👥",
    //     name: "User Management",
    //     color: "#00e5b0",
    //     permissions: [
    //       {
    //         id: "users.view",
    //         name: "View Users",
    //         desc: "See the user directory",
    //       },
    //       {
    //         id: "users.invite",
    //         name: "Invite Users",
    //         desc: "Send invitations to new members",
    //       },
    //       {
    //         id: "users.modify",
    //         name: "Modify Users",
    //         desc: "Edit user profiles and roles",
    //       },
    //       {
    //         id: "users.deactivate",
    //         name: "Deactivate Users",
    //         desc: "Suspend or remove accounts",
    //       },
    //     ],
    //   },
    //   {
    //     id: "billing",
    //     icon: "💳",
    //     name: "Billing & Finance",
    //     color: "#f5a623",
    //     permissions: [
    //       {
    //         id: "billing.view",
    //         name: "View Invoices",
    //         desc: "See billing history",
    //       },
    //       {
    //         id: "billing.manage",
    //         name: "Manage Billing",
    //         desc: "Update payment methods",
    //       },
    //       {
    //         id: "billing.refund",
    //         name: "Issue Refunds",
    //         desc: "Process refunds and credits",
    //       },
    //     ],
    //   },
    //   {
    //     id: "system",
    //     icon: "⚙️",
    //     name: "System Settings",
    //     color: "#ff4b6e",
    //     permissions: [
    //       {
    //         id: "system.config",
    //         name: "Configuration",
    //         desc: "Modify system settings",
    //       },
    //       {
    //         id: "system.logs",
    //         name: "View Logs",
    //         desc: "Access system audit logs",
    //       },
    //       {
    //         id: "system.api",
    //         name: "API Access",
    //         desc: "Generate and manage API keys",
    //       },
    //       {
    //         id: "system.deploy",
    //         name: "Deploy",
    //         desc: "Trigger deployment pipelines",
    //       },
    //     ],
    //   },
    //   {
    //     id: "reports",
    //     icon: "📊",
    //     name: "Reports & Analytics",
    //     color: "#4facfe",
    //     permissions: [
    //       {
    //         id: "reports.view",
    //         name: "View Reports",
    //         desc: "Access analytics dashboards",
    //       },
    //       {
    //         id: "reports.create",
    //         name: "Create Reports",
    //         desc: "Build custom reports",
    //       },
    //       {
    //         id: "reports.share",
    //         name: "Share Reports",
    //         desc: "Distribute reports externally",
    //       },
    //     ],
    //   },
    // ],
    // USERS: [
    //   {
    //     id: 1,
    //     name: "Alice Martin",
    //     email: "alice@acme.co",
    //     role: "Engineering Lead",
    //     color: 0,
    //     perms: {
    //       "data.read": true,
    //       "data.write": true,
    //       "data.export": true,
    //       "users.view": true,
    //       "system.logs": true,
    //       "reports.view": true,
    //       "reports.create": true,
    //     },
    //   },
    //   {
    //     id: 2,
    //     name: "Ben Torres",
    //     email: "ben@acme.co",
    //     role: "Product Manager",
    //     color: 1,
    //     perms: {
    //       "data.read": true,
    //       "users.view": true,
    //       "users.invite": true,
    //       "reports.view": true,
    //       "reports.create": true,
    //       "reports.share": true,
    //     },
    //   },
    //   {
    //     id: 3,
    //     name: "Carla Reyes",
    //     email: "carla@acme.co",
    //     role: "Designer",
    //     color: 2,
    //     perms: { "data.read": true, "reports.view": true },
    //   },
    //   {
    //     id: 4,
    //     name: "David Kim",
    //     email: "d.kim@acme.co",
    //     role: "Finance",
    //     color: 3,
    //     perms: {
    //       "data.read": true,
    //       "billing.view": true,
    //       "billing.manage": true,
    //       "billing.refund": true,
    //       "reports.view": true,
    //     },
    //   },
    //   {
    //     id: 5,
    //     name: "Elena Walsh",
    //     email: "elena@acme.co",
    //     role: "Support",
    //     color: 4,
    //     perms: { "data.read": true, "users.view": true, "reports.view": true },
    //   },
    //   {
    //     id: 6,
    //     name: "Felix Grant",
    //     email: "felix@acme.co",
    //     role: "DevOps",
    //     color: 5,
    //     perms: {
    //       "data.read": true,
    //       "data.write": true,
    //       "system.config": true,
    //       "system.logs": true,
    //       "system.api": true,
    //       "system.deploy": true,
    //     },
    //   },
    //   {
    //     id: 7,
    //     name: "Grace Liu",
    //     email: "grace@acme.co",
    //     role: "Analyst",
    //     color: 6,
    //     perms: {
    //       "data.read": true,
    //       "data.export": true,
    //       "reports.view": true,
    //       "reports.create": true,
    //       "reports.share": true,
    //     },
    //   },
    //   {
    //     id: 8,
    //     name: "Hiro Tanaka",
    //     email: "hiro@acme.co",
    //     role: "Intern",
    //     color: 7,
    //     perms: { "data.read": true },
    //   },
    // ],
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
      this._listeners[ev] = (this._listeners[ev] || []).filter((f) => f !== fn);
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
AppStore.then((appStore) => {
  appStore.USERS.forEach((u) => {
    appStore.ACTIVITY[u.id] = [];
  });
});
