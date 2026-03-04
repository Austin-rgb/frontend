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

const DOM = {
  toolbar: $('#toolbar'),
  tableContainer: $('#table-container'),
  statsBar: $('#stats-bar'),
  modalRoot: $('#modal-root'),
  loadingRoot: $('#loading-root'),
  errorRoot: $('#error-root'),
  apiUrlEl: $('#api-url-display'),
};

/* ─── Render loop ───────────────────────────────────────────────── */
function render(snap) {
  renderLoading(DOM.loadingRoot, snap.loading);
  renderError(DOM.errorRoot, snap.error);
  renderStats(DOM.statsBar, snap.filtered);

  renderTable(DOM.tableContainer, {
    items: snap.filtered,
    sortField: snap.sortField,
    sortDir: snap.sortDir,
    onSort: (field) => state.setSort(field),
  });

  renderModal(DOM.modalRoot, {
    mode: snap.modal.mode,
    item: snap.modal.item,
    onSave: handleSave,
    onClose: () => state.closeModal(),
  });
}

/* ─── Event delegation — table actions ─────────────────────────── */
DOM.tableContainer.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const { action, id } = btn.dataset;
  const snap = (() => {
    // Pull latest item from state's items list
    let item = null;
    state.subscribe((s) => { item = s.items.find((i) => String(i.id) === id) ?? null; })();
    return item;
  })();

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
renderToolbar(DOM.toolbar, {
  onSearch: (text) => state.setFilter(text),
  onCreateClick: () => state.openCreate(),
});

/* ─── Save handler (create / update) ───────────────────────────── */
async function handleSave(payload, onError) {
  if (state.submitting) return;
  state.setSubmitting(true);

  let currentModal;
  state.subscribe((s) => { currentModal = s.modal; })();

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
state.subscribe(render);

// Load data
loadItems();

// Reload button
$('#reload-btn')?.addEventListener('click', loadItems);

