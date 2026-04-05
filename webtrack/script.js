// ─── Config ──────────────────────────────────────────────────────────────
let BASE_URL =
  localStorage.getItem("webtrack_base_url") || "http://localhost:8080";
const SETTINGS_KEY = "webtrack_base_url";

function api(path, opts = {}) {
  const url = BASE_URL.replace(/\/$/, "") + path;
  return fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
}

// ─── State ───────────────────────────────────────────────────────────────
const state = {
  containers: [],
  tags: [],
  currentEditTagId: null,
  containerPage: 1,
  tagPage: 1,
  trackPage: 1,
};

// ─── Toast ───────────────────────────────────────────────────────────────
function toast(msg, type = "info") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ─── Navigation ──────────────────────────────────────────────────────────
function navigate(page) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  document.querySelector(`[data-page="${page}"]`).classList.add("active");
  if (page === "containers") loadContainers(1);
  if (page === "tags") loadTags(1);
  if (page === "tracks") loadTracks(1);
  if (page === "dashboard") loadDashboard();
  if (page === "settings") loadSettings();
}

// ─── Modal ────────────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

// ─── Connection Status ────────────────────────────────────────────────────
async function checkStatus() {
  const dot = document.getElementById("statusDot");
  const txt = document.getElementById("statusText");
  try {
    const r = await api("/containers?limit=1");
    if (r.ok) {
      dot.className = "status-dot";
      txt.textContent = "connected · " + BASE_URL.replace(/https?:\/\//, "");
    } else throw new Error();
  } catch {
    dot.className = "status-dot error";
    txt.textContent = "disconnected";
  }
}

// ─── Dashboard ───────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const [cr, tr] = await Promise.all([
      api("/containers?limit=100"),
      api("/tracks?limit=20"),
    ]);
    const cd = await cr.json();
    const td = await tr.json();

    const containers = cd.items || [];
    state.containers = containers;

    document.getElementById("stat-containers").textContent = containers.length;
    document.getElementById("stat-active").textContent = containers.length;

    // Count tags
    let tagTotal = 0;
    const tagCounts = {};
    for (const c of containers) {
      try {
        const tr2 = await api(`/containers/${c.id}/tags?limit=1`);
        const td2 = await tr2.json();
        const cnt =
          (td2.pagination?.pages || 0) > 0
            ? td2.items?.length
            : td2.items?.length || 0;
        // Try to get actual count via pagination
        tagCounts[c.id] = td2.items?.length || 0;
        tagTotal += td2.items?.length || 0;
      } catch {}
    }
    document.getElementById("stat-tags").textContent = tagTotal;
    document.getElementById("stat-tracks").textContent =
      (td.pagination?.pages || 1) > 1
        ? `${(td.pagination.pages - 1) * 100}+`
        : td.items?.length || 0;

    // Feed
    const feed = document.getElementById("dashFeed");
    const tracks = td.items || [];
    if (tracks.length === 0) {
      feed.innerHTML =
        '<div class="empty-state"><div class="empty-icon">∅</div><div class="empty-title">No events yet</div></div>';
    } else {
      feed.innerHTML = tracks
        .slice(0, 12)
        .map(
          (t) => `
        <div class="feed-item">
          <span class="feed-time">${formatTime(t.received_at)}</span>
          <span class="feed-event">${esc(t.event)}</span>
          <span class="feed-container">${esc(t.container_id.slice(0, 8))}…</span>
        </div>
      `,
        )
        .join("");
    }

    // Container list
    const cl = document.getElementById("dashContainerList");
    if (containers.length === 0) {
      cl.innerHTML =
        '<div class="empty-state"><div class="empty-icon">▣</div><div class="empty-title">No containers</div></div>';
    } else {
      cl.innerHTML = containers
        .slice(0, 8)
        .map(
          (c) => `
        <div style="display:flex;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px solid var(--border);">
          <span class="badge badge-accent">▣</span>
          <span style="font-size:12.5px">${esc(c.name || "Unnamed")}</span>
          <span class="cell-id" style="margin-left:auto">${esc(c.id.slice(0, 10))}…</span>
        </div>
      `,
        )
        .join("");
    }

    document.getElementById("badge-containers").textContent = containers.length;
  } catch (e) {
    toast("Failed to load dashboard", "error");
  }
}

// ─── Containers ───────────────────────────────────────────────────────────
async function loadContainers(page = 1) {
  state.containerPage = page;
  const tbody = document.getElementById("containersTbody");
  tbody.innerHTML =
    '<tr class="loading-row"><td colspan="5"><div class="spinner" style="margin:0 auto"></div></td></tr>';
  try {
    const r = await api(`/containers?page=${page}&limit=20`);
    const d = await r.json();
    const items = d.items || [];
    state.containers = items;
    document.getElementById("badge-containers").textContent = items.length;

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">▣</div><div class="empty-title">No containers</div><div class="empty-sub">Create one to get started</div></div></td></tr>`;
      return;
    }

    // Populate container filter dropdowns
    populateContainerDropdowns(items);

    tbody.innerHTML = items
      .map(
        (c) => `
      <tr>
        <td><span class="cell-id" title="${esc(c.id)}">${esc(c.id.slice(0, 14))}…</span></td>
        <td><strong>${esc(c.name || "—")}</strong></td>
        <td><button class="btn btn-ghost btn-sm" onclick="navigate('tags');filterTagsFor('${esc(c.id)}')">View Tags →</button></td>
        <td>
          <div style="display:flex;align-items:center;gap:6px;">
            <code style="font-family:var(--mono);font-size:10px;color:var(--text-mute)">/containers/${esc(c.id.slice(0, 8))}…/config</code>
            <button class="btn btn-ghost btn-sm" onclick="copyConfigUrl('${esc(c.id)}')">⧉</button>
          </div>
        </td>
        <td>
          <div style="display:flex;gap:4px;justify-content:flex-end">
            <button class="btn btn-ghost btn-sm" onclick="openContainerDetail('${esc(c.id)}')">Detail</button>
          </div>
        </td>
      </tr>
    `,
      )
      .join("");

    renderPagination("containersPagination", d.pagination, loadContainers);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding:20px;color:var(--red);font-family:var(--mono);font-size:11px;text-align:center">Error loading containers</td></tr>`;
    toast("Failed to load containers", "error");
  }
}

function openCreateContainer() {
  document.getElementById("createContainerName").value = "";
  openModal("modal-createContainer");
  setTimeout(() => document.getElementById("createContainerName").focus(), 80);
}

async function createContainer() {
  const name = document.getElementById("createContainerName").value.trim();
  try {
    const r = await api("/containers", {
      method: "POST",
      body: JSON.stringify({ name: name || undefined }),
    });
    if (!r.ok) throw new Error();
    const c = await r.json();
    closeModal("modal-createContainer");
    toast(`Container created: ${c.name || c.id}`, "success");
    loadContainers(state.containerPage);
    loadDashboard();
  } catch {
    toast("Failed to create container", "error");
  }
}

async function openContainerDetail(id) {
  const body = document.getElementById("containerDetailBody");
  const title = document.getElementById("containerDetailTitle");
  body.innerHTML = '<div class="spinner" style="margin:20px auto"></div>';
  openModal("modal-containerDetail");

  try {
    const r = await api(`/containers/${id}`);
    const c = await r.json();
    title.textContent = c.name || "Container";

    const configUrl = BASE_URL.replace(/\/$/, "") + `/containers/${id}/config`;
    body.innerHTML = `
      <div class="detail-row"><div class="detail-key">ID</div><div class="detail-val cell-mono">${esc(c.id)}</div></div>
      <div class="detail-row"><div class="detail-key">Name</div><div class="detail-val">${esc(c.name || "—")}</div></div>
      <div class="detail-row"><div class="detail-key">Config URL</div>
        <div class="detail-val" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <code class="code-block" style="padding:4px 8px;max-height:none;flex:1">${esc(configUrl)}</code>
          <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${esc(configUrl)}')">⧉ Copy</button>
        </div>
      </div>
      <div style="margin-top:12px">
        <div class="card-title" style="margin-bottom:8px">Embed Snippet</div>
        <div class="config-box">${buildSnippet(id)}
<button class="copy-btn" onclick="copyToClipboard(document.getElementById('snippet-${id}').textContent)">copy</button></div>
      </div>
    `;

    document.getElementById("containerDeleteBtn").onclick = () =>
      deleteContainer(id);
  } catch {
    body.innerHTML =
      '<div style="color:var(--red);font-family:var(--mono);font-size:11px;padding:20px">Failed to load container</div>';
  }
}

async function deleteContainer(id) {
  if (!confirm("Delete this container and all its tags?")) return;
  toast("Delete is not implemented on this demo endpoint", "info");
  closeModal("modal-containerDetail");
}

function copyConfigUrl(id) {
  copyToClipboard(BASE_URL.replace(/\/$/, "") + `/containers/${id}/config`);
}

// ─── Tags ─────────────────────────────────────────────────────────────────
async function loadTags(page = 1, containerId = null) {
  state.tagPage = page;
  const filter =
    containerId || document.getElementById("tagsContainerFilter").value || null;
  const tbody = document.getElementById("tagsTbody");
  tbody.innerHTML =
    '<tr class="loading-row"><td colspan="7"><div class="spinner" style="margin:0 auto"></div></td></tr>';

  try {
    let items = [];
    let pagination = null;

    if (filter) {
      const r = await api(`/containers/${filter}/tags?page=${page}&limit=20`);
      const d = await r.json();
      items = d.items || [];
      pagination = d.pagination;
      document.getElementById("tagsSubtitle").textContent =
        `Container: ${filter.slice(0, 16)}…`;
    } else {
      // Load tags for all containers
      const cr = await api("/containers?limit=100");
      const cd = await cr.json();
      const containers = cd.items || [];
      for (const c of containers) {
        try {
          const tr = await api(`/containers/${c.id}/tags?limit=100`);
          const td = await tr.json();
          (td.items || []).forEach((t) =>
            items.push({
              ...t,
              _containerName: c.name || c.id.slice(0, 8) + "…",
            }),
          );
        } catch {}
      }
      document.getElementById("tagsSubtitle").textContent =
        `All tags (${items.length})`;
    }

    document.getElementById("badge-tags").textContent = items.length;

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">◇</div><div class="empty-title">No tags</div></div></td></tr>`;
      return;
    }

    tbody.innerHTML = items
      .map(
        (t) => `
      <tr>
        <td><span class="cell-id" title="${esc(t.id)}">${esc(t.id.slice(0, 12))}…</span></td>
        <td><strong>${esc(t.name || "—")}</strong></td>
        <td><span class="badge badge-mute">${esc(t._containerName || t.container_id?.slice(0, 8) + "…")}</span></td>
        <td><span class="badge badge-accent">${esc(t.event || "—")}</span></td>
        <td>
          ${
            t.conditions?.length > 0
              ? `<div class="chips">${t.conditions.map((c) => `<span class="chip">${esc(c.field)} ${esc(c.operator)} ${esc(c.value)}</span>`).join("")}</div>`
              : '<span style="color:var(--text-mute);font-size:11px">—</span>'
          }
        </td>
        <td><span class="cell-mono" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;display:inline-block;white-space:nowrap" title="${esc(t.action || "")}">${esc((t.action || "").slice(0, 40))}${(t.action || "").length > 40 ? "…" : ""}</span></td>
        <td>
          <div style="display:flex;gap:4px;justify-content:flex-end">
            <button class="btn btn-ghost btn-sm" onclick="openEditTag(${JSON.stringify(t).replace(/"/g, "&quot;")})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteTag('${esc(t.id)}')">✕</button>
          </div>
        </td>
      </tr>
    `,
      )
      .join("");

    if (pagination) renderPagination("tagsPagination", pagination, loadTags);
    else document.getElementById("tagsPagination").innerHTML = "";
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:20px;color:var(--red);font-family:var(--mono);font-size:11px;text-align:center">Error loading tags</td></tr>`;
    toast("Failed to load tags", "error");
  }
}

function filterTagsByContainer() {
  loadTags(1);
}
function filterTagsFor(cid) {
  document.getElementById("tagsContainerFilter").value = cid;
  loadTags(1, cid);
}

function openCreateTag() {
  document.getElementById("createTagName").value = "";
  document.getElementById("createTagEvent").value = "";
  document.getElementById("createTagAction").value = "";
  document.getElementById("createTagConditions").innerHTML = "";
  openModal("modal-createTag");
}

async function submitCreateTag() {
  const cid = document.getElementById("createTagContainer").value;
  const name = document.getElementById("createTagName").value.trim();
  const event = document.getElementById("createTagEvent").value.trim();
  const action = document.getElementById("createTagAction").value.trim();
  const conditions = getConditions("createTagConditions");

  if (!cid) {
    toast("Select a container", "error");
    return;
  }
  if (!name) {
    toast("Tag name required", "error");
    return;
  }
  if (!event) {
    toast("Event required", "error");
    return;
  }

  try {
    const r = await api(`/containers/${cid}/tags`, {
      method: "POST",
      body: JSON.stringify({ name, event, action, conditions }),
    });
    if (!r.ok) throw new Error();
    closeModal("modal-createTag");
    toast("Tag created", "success");
    loadTags(state.tagPage);
  } catch {
    toast("Failed to create tag", "error");
  }
}

function openEditTag(tag) {
  state.currentEditTagId = tag.id;
  document.getElementById("editTagName").value = tag.name || "";
  document.getElementById("editTagEvent").value = tag.event || "";
  document.getElementById("editTagAction").value = tag.action || "";
  const condContainer = document.getElementById("editTagConditions");
  condContainer.innerHTML = "";
  (tag.conditions || []).forEach((c) =>
    addConditionRow("editTagConditions", c),
  );

  document.getElementById("editTagDeleteBtn").onclick = () => deleteTag(tag.id);
  openModal("modal-editTag");
}

async function submitEditTag() {
  const tid = state.currentEditTagId;
  const name = document.getElementById("editTagName").value.trim() || null;
  const event = document.getElementById("editTagEvent").value.trim() || null;
  const action = document.getElementById("editTagAction").value.trim() || null;
  const conditions = getConditions("editTagConditions");

  try {
    const r = await api(`/tags/${tid}`, {
      method: "PUT",
      body: JSON.stringify({
        name,
        event,
        action,
        conditions: conditions.length ? conditions : null,
      }),
    });
    if (!r.ok) throw new Error();
    closeModal("modal-editTag");
    toast("Tag updated", "success");
    loadTags(state.tagPage);
  } catch {
    toast("Failed to update tag", "error");
  }
}

async function deleteTag(tid) {
  if (!confirm("Delete this tag?")) return;
  try {
    const r = await api(`/tags/${tid}`, { method: "DELETE" });
    if (!r.ok) throw new Error();
    closeModal("modal-editTag");
    toast("Tag deleted", "success");
    loadTags(state.tagPage);
  } catch {
    toast("Failed to delete tag", "error");
  }
}

// Conditions
function addConditionRow(containerId, data = {}) {
  const div = document.createElement("div");
  div.className = "condition-row";
  div.innerHTML = `
    <input class="form-input" placeholder="field" value="${esc(data.field || "")}" data-role="cond-field" />
    <input class="form-input" placeholder="operator" value="${esc(data.operator || "")}" data-role="cond-op" />
    <input class="form-input" placeholder="value" value="${esc(data.value || "")}" data-role="cond-val" />
    <button class="condition-remove" onclick="this.parentElement.remove()">✕</button>
  `;
  document.getElementById(containerId).appendChild(div);
}

function getConditions(containerId) {
  const rows = document.querySelectorAll(`#${containerId} .condition-row`);
  return Array.from(rows)
    .map((row) => ({
      field: row.querySelector('[data-role="cond-field"]').value.trim(),
      operator: row.querySelector('[data-role="cond-op"]').value.trim(),
      value: row.querySelector('[data-role="cond-val"]').value.trim(),
    }))
    .filter((c) => c.field && c.operator);
}

// ─── Tracks ───────────────────────────────────────────────────────────────
async function loadTracks(page = 1) {
  state.trackPage = page;
  const cid = document.getElementById("tracksContainerFilter").value || "";
  const tbody = document.getElementById("tracksTbody");
  tbody.innerHTML =
    '<tr class="loading-row"><td colspan="6"><div class="spinner" style="margin:0 auto"></div></td></tr>';

  try {
    const qs = new URLSearchParams({ page, limit: 20 });
    if (cid) qs.set("containerId", cid);
    const r = await api(`/tracks?${qs}`);
    const d = await r.json();
    const items = d.items || [];

    document.getElementById("badge-tracks").textContent = items.length;
    document.getElementById("tracksCount").textContent =
      items.length + " events";

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">≡</div><div class="empty-title">No tracks</div></div></td></tr>`;
      return;
    }

    tbody.innerHTML = items
      .map(
        (t) => `
      <tr style="cursor:pointer" onclick="openTrackDetail(${JSON.stringify(t).replace(/"/g, "&quot;")})">
        <td><span class="cell-id" title="${esc(t.id)}">${esc(t.id.slice(0, 12))}…</span></td>
        <td><span class="badge badge-mute">${esc(t.container_id?.slice(0, 8))}…</span></td>
        <td><span class="badge badge-accent">${esc(t.event)}</span></td>
        <td><span class="cell-mono">${t.timestamp ? new Date(t.timestamp).toLocaleString() : "—"}</span></td>
        <td><span class="cell-mono">${formatTime(t.received_at)}</span></td>
        <td><span class="cell-mono" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;display:inline-block;white-space:nowrap">${esc((t.data || "").slice(0, 60))}${(t.data || "").length > 60 ? "…" : ""}</span></td>
      </tr>
    `,
      )
      .join("");

    renderPagination("tracksPagination", d.pagination, loadTracks);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:20px;color:var(--red);font-family:var(--mono);font-size:11px;text-align:center">Error loading tracks</td></tr>`;
    toast("Failed to load tracks", "error");
  }
}

function openTrackDetail(track) {
  const body = document.getElementById("trackDetailBody");
  body.innerHTML = `
    <div class="detail-row"><div class="detail-key">ID</div><div class="detail-val cell-mono">${esc(track.id)}</div></div>
    <div class="detail-row"><div class="detail-key">Container ID</div><div class="detail-val cell-mono">${esc(track.container_id)}</div></div>
    <div class="detail-row"><div class="detail-key">Event</div><div class="detail-val"><span class="badge badge-accent">${esc(track.event)}</span></div></div>
    <div class="detail-row"><div class="detail-key">Timestamp</div><div class="detail-val cell-mono">${track.timestamp ? new Date(track.timestamp).toISOString() : "—"}</div></div>
    <div class="detail-row"><div class="detail-key">Received At</div><div class="detail-val cell-mono">${esc(track.received_at || "—")}</div></div>
    <div class="detail-row"><div class="detail-key">Data</div>
      <div class="detail-val" style="flex:1">
        <div class="code-block">${esc(formatJson(track.data))}</div>
      </div>
    </div>
  `;
  openModal("modal-trackDetail");
}

function openSendTrack() {
  document.getElementById("sendTrackEvent").value = "";
  document.getElementById("sendTrackTimestamp").value = Date.now();
  document.getElementById("sendTrackData").value = "{}";
  openModal("modal-sendTrack");
}

async function sendTrack() {
  const container_id = document.getElementById("sendTrackContainer").value;
  const event = document.getElementById("sendTrackEvent").value.trim();
  const timestamp =
    parseInt(document.getElementById("sendTrackTimestamp").value) || Date.now();
  const data = document.getElementById("sendTrackData").value.trim();

  if (!container_id) {
    toast("Select a container", "error");
    return;
  }
  if (!event) {
    toast("Event name required", "error");
    return;
  }

  try {
    const r = await api("/track", {
      method: "POST",
      body: JSON.stringify({ container_id, event, timestamp, data }),
    });
    if (!r.ok) throw new Error();
    closeModal("modal-sendTrack");
    toast("Track event sent", "success");
    if (document.getElementById("page-tracks").classList.contains("active"))
      loadTracks(1);
  } catch {
    toast("Failed to send track event", "error");
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────
function loadSettings() {
  document.getElementById("settingsBaseUrl").value = BASE_URL;
  document.getElementById("settingsStatus").textContent = "Not tested";
}

function saveSettings() {
  BASE_URL =
    document
      .getElementById("settingsBaseUrl")
      .value.trim()
      .replace(/\/$/, "") || "http://localhost:8080";
  localStorage.setItem(SETTINGS_KEY, BASE_URL);
  toast("Settings saved", "success");
  checkStatus();
}

async function testConnection() {
  const url = document
    .getElementById("settingsBaseUrl")
    .value.trim()
    .replace(/\/$/, "");
  const status = document.getElementById("settingsStatus");
  status.textContent = "Testing…";
  try {
    const r = await fetch(url + "/containers?limit=1", {
      headers: { "Content-Type": "application/json" },
    });
    if (r.ok) {
      status.style.color = "var(--green)";
      status.textContent = "✓ Connected";
    } else {
      status.style.color = "var(--orange)";
      status.textContent = `HTTP ${r.status}`;
    }
  } catch {
    status.style.color = "var(--red)";
    status.textContent = "✕ Could not connect";
  }
}

function updateSnippet() {
  const cid = document.getElementById("snippetCid").value.trim();
  document.getElementById("snippetBox").innerHTML = cid
    ? `<button class="copy-btn" onclick="copySnippet()">copy</button>` +
      buildSnippet(cid)
    : '<span style="color:var(--text-mute)">// Enter a container ID above</span>';
}

function buildSnippet(cid) {
  const base = BASE_URL.replace(/\/$/, "");
  return `&lt;script&gt;
(function() {
  var config = "${base}/containers/${cid}/config";
  fetch(config).then(r=>r.json()).then(tags=>{
    // process tags…
  });
})();
&lt;/script&gt;`;
}

function copySnippet() {
  const cid = document.getElementById("snippetCid")?.value?.trim() || "";
  copyToClipboard(
    buildSnippet(cid).replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function esc(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTime(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return ts;
  }
}

function formatJson(s) {
  if (!s) return "—";
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}

function copyToClipboard(text) {
  const clean = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
  navigator.clipboard
    .writeText(clean)
    .then(() => toast("Copied to clipboard", "success"));
}

function populateContainerDropdowns(containers) {
  state.containers = containers;
  const opts = containers
    .map(
      (c) =>
        `<option value="${esc(c.id)}">${esc(c.name || c.id.slice(0, 12) + "…")}</option>`,
    )
    .join("");

  ["tagsContainerFilter", "tracksContainerFilter"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = el.value;
    el.innerHTML = '<option value="">All Containers</option>' + opts;
    el.value = prev || "";
  });

  ["createTagContainer", "sendTrackContainer"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = el.value;
    el.innerHTML = '<option value="">Select container…</option>' + opts;
    el.value = prev || "";
  });
}

function renderPagination(containerId, pagination, loadFn) {
  const el = document.getElementById(containerId);
  if (!pagination) {
    el.innerHTML = "";
    return;
  }
  const { pages, req } = pagination;
  const currentPage = req?.page || 1;
  if (pages <= 1) {
    el.innerHTML = "";
    return;
  }

  let html = `<span class="pagination-info">Page ${currentPage} of ${pages}</span>`;
  html += `<button class="page-btn" ${currentPage <= 1 ? "disabled" : ""} onclick="${loadFn.name}(${currentPage - 1})">‹</button>`;

  for (let i = 1; i <= Math.min(pages, 7); i++) {
    html += `<button class="page-btn ${i === currentPage ? "active" : ""}" onclick="${loadFn.name}(${i})">${i}</button>`;
  }
  if (pages > 7)
    html += `<span class="page-btn" style="cursor:default;opacity:.4">…</span>`;

  html += `<button class="page-btn" ${currentPage >= pages ? "disabled" : ""} onclick="${loadFn.name}(${currentPage + 1})">›</button>`;
  el.innerHTML = html;
}

async function refreshAll() {
  await Promise.all([loadDashboard(), checkStatus()]);
  toast("Refreshed", "info");
}

// ─── Init ─────────────────────────────────────────────────────────────────
(async function init() {
  await checkStatus();
  loadDashboard();

  // Pre-load containers for dropdowns
  try {
    const r = await api("/containers?limit=100");
    const d = await r.json();
    populateContainerDropdowns(d.items || []);
  } catch {}
})();
