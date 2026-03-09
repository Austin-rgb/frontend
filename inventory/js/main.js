// main.js — application entry point

import { api } from './api.js';
import { state } from './state.js';
import {
  renderToolbar,
  renderTable,
  renderLoading,
  renderError,
  renderModal,
  renderStats,
  toast,
} from './ui.js';

/* ─── DOM refs ──────────────────────────────────────────────────── */
const $ = (sel) => document.querySelector(sel);

function upgradeHost(selector, tagName) {
  const oldNode = $(selector);
  if (!oldNode) return null;

  const newNode = document.createElement(tagName);
  for (const attr of oldNode.attributes) {
    newNode.setAttribute(attr.name, attr.value);
  }
  newNode.className = oldNode.className;
  oldNode.replaceWith(newNode);
  return newNode;
}

class InventoryToolbar extends HTMLElement {
  setProps({ onSearch, onCreateClick }) {
    renderToolbar(this, { onSearch, onCreateClick });
  }
}

class InventoryStats extends HTMLElement {
  setItems(items) {
    renderStats(this, items);
  }
}

class InventoryTable extends HTMLElement {
  setProps({ items, sortField, sortDir, onSort }) {
    renderTable(this, { items, sortField, sortDir, onSort });
  }
}

class InventoryLoading extends HTMLElement {
  setVisible(visible) {
    renderLoading(this, visible);
  }
}

class InventoryError extends HTMLElement {
  setMessage(message) {
    renderError(this, message);
  }
}

class InventoryModal extends HTMLElement {
  setProps({ mode, item, onSave, onClose }) {
    renderModal(this, { mode, item, onSave, onClose });
  }
}

if (!customElements.get('inventory-toolbar')) customElements.define('inventory-toolbar', InventoryToolbar);
if (!customElements.get('inventory-stats')) customElements.define('inventory-stats', InventoryStats);
if (!customElements.get('inventory-table')) customElements.define('inventory-table', InventoryTable);
if (!customElements.get('inventory-loading')) customElements.define('inventory-loading', InventoryLoading);
if (!customElements.get('inventory-error')) customElements.define('inventory-error', InventoryError);
if (!customElements.get('inventory-modal')) customElements.define('inventory-modal', InventoryModal);

const DOM = {
  toolbar: upgradeHost('#toolbar', 'inventory-toolbar'),
  tableContainer: upgradeHost('#table-container', 'inventory-table'),
  statsBar: upgradeHost('#stats-bar', 'inventory-stats'),
  modalRoot: upgradeHost('#modal-root', 'inventory-modal'),
  loadingRoot: upgradeHost('#loading-root', 'inventory-loading'),
  errorRoot: upgradeHost('#error-root', 'inventory-error'),
  apiUrlEl: $('#api-url-display'),
};

let latestSnap = null;

/* ─── Render loop ───────────────────────────────────────────────── */
function render(snap) {
  DOM.loadingRoot?.setVisible(snap.loading);
  DOM.errorRoot?.setMessage(snap.error);
  DOM.statsBar?.setItems(snap.filtered);

  DOM.tableContainer?.setProps({
    items: snap.filtered,
    sortField: snap.sortField,
    sortDir: snap.sortDir,
    onSort: (field) => state.setSort(field),
  });

  DOM.modalRoot?.setProps({
    mode: snap.modal.mode,
    item: snap.modal.item,
    onSave: handleSave,
    onClose: () => state.closeModal(),
  });
}

/* ─── Event delegation — table actions ─────────────────────────── */
DOM.tableContainer?.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const { action, id } = btn.dataset;
  const snap = latestSnap?.items?.find((i) => String(i.id) === id) ?? null;

  if (action === 'view') {
    // Fetch fresh detail
    state.setLoading(true);
    try {
      const item = await api.getItem(id);
      state.setLoading(false);
      state.openDetail(item);
    } catch (err) {
      state.setLoading(false);
      toast(`Failed to load item: ${err.message}`);
    }
  }

  if (action === 'edit') {
    state.setLoading(true);
    try {
      const item = await api.getItem(id);
      state.setLoading(false);
      state.openEdit(item);
    } catch (err) {
      state.setLoading(false);
      toast(`Failed to load item: ${err.message}`);
    }
  }

  if (action === 'delete') {
    const confirmed = window.confirm(`Delete item "${snap?.name ?? id}"? This cannot be undone.`);
    if (!confirmed) return;

    btn.disabled = true;
    try {
      await api.deleteItem(id);
      state.removeItem(id);
      toast('Item deleted.', 'success');
    } catch (err) {
      toast(`Delete failed: ${err.message}`);
      btn.disabled = false;
    }
  }
});

/* ─── Keyboard: close modal on Escape ──────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') state.closeModal();
});

/* ─── Toolbar callbacks ─────────────────────────────────────────── */
DOM.toolbar?.setProps({
  onSearch: (text) => state.setFilter(text),
  onCreateClick: () => state.openCreate(),
});

/* ─── Save handler (create / update) ───────────────────────────── */
async function handleSave(payload, onError) {
  if (latestSnap?.submitting) return;
  state.setSubmitting(true);
  const currentModal = latestSnap?.modal ?? { mode: 'none', item: null };

  try {
    let saved;
    if (currentModal.mode === 'create') {
      saved = await api.createItem(payload);
    } else {
      saved = await api.updateItem(currentModal.item.id, payload);
    }
    state.upsertItem(saved);
    state.setSubmitting(false);
    state.closeModal();
    toast(currentModal.mode === 'create' ? 'Item created.' : 'Item updated.', 'success');
  } catch (err) {
    state.setSubmitting(false);
    onError();
    toast(`Save failed: ${err.message}`);
  }
}

/* ─── Initial data load ─────────────────────────────────────────── */
async function loadItems() {
  state.setLoading(true);
  state.clearError();
  try {
    const items = await api.listItems();
    state.setItems(items);
    state.setLoading(false);
  } catch (err) {
    state.setLoading(false);
    state.setError(`Could not load inventory: ${err.message}`);
  }
}

/* ─── Bootstrap ─────────────────────────────────────────────────── */
if (DOM.apiUrlEl) {
  DOM.apiUrlEl.textContent = api.getBaseUrl();
}

// Wire state → render
state.subscribe((snap) => {
  latestSnap = snap;
  render(snap);
});

// Load data
loadItems();

// Reload button
$('#reload-btn')?.addEventListener('click', loadItems);
