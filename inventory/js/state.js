// state.js — centralised application state

/** @typedef {{ id: string, name: string, description: string, quantity: number, price: number, lastUpdated: string }} Item */

const SORT_FIELDS = ['name', 'quantity', 'price', 'lastUpdated'];

function createState() {
  /** @type {Item[]} */
  let _items = [];
  let _loading = false;
  let _error = null;

  let _sortField = 'name';
  let _sortDir = 'asc'; // 'asc' | 'desc'
  let _filterText = '';
  let _submitting = false;

  /** @type {{ mode: 'none'|'create'|'edit'|'detail', item: Item|null }} */
  let _modal = { mode: 'none', item: null };

  /** @type {Set<Function>} */
  const _listeners = new Set();

  function notify() {
    _listeners.forEach((fn) => fn(snapshot()));
  }

  function snapshot() {
    return {
      items: _items,
      filtered: _applyFilterSort(_items, _filterText, _sortField, _sortDir),
      loading: _loading,
      error: _error,
      sortField: _sortField,
      sortDir: _sortDir,
      filterText: _filterText,
      submitting: _submitting,
      modal: { ..._modal },
    };
  }

  function _applyFilterSort(items, text, field, dir) {
    const q = text.trim().toLowerCase();
    let result = q
      ? items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            (i.description ?? '').toLowerCase().includes(q) ||
            String(i.id).toLowerCase().includes(q),
        )
      : [...items];

    result.sort((a, b) => {
      let av = a[field];
      let bv = b[field];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }

  return {
    subscribe(fn) {
      _listeners.add(fn);
      fn(snapshot());
      return () => _listeners.delete(fn);
    },

    setItems(items) {
      _items = items;
      notify();
    },

    upsertItem(item) {
      const idx = _items.findIndex((i) => String(i.id) === String(item.id));
      if (idx === -1) {
        _items = [item, ..._items];
      } else {
        _items = _items.map((i) => (String(i.id) === String(item.id) ? item : i));
      }
      notify();
    },

    removeItem(id) {
      _items = _items.filter((i) => String(i.id) !== String(id));
      notify();
    },

    setLoading(v) {
      _loading = v;
      notify();
    },

    setError(msg) {
      _error = msg;
      notify();
    },

    clearError() {
      _error = null;
      notify();
    },

    setSubmitting(v) {
      _submitting = v;
      notify();
    },

    setFilter(text) {
      _filterText = text;
      notify();
    },

    setSort(field) {
      if (!SORT_FIELDS.includes(field)) return;
      if (_sortField === field) {
        _sortDir = _sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        _sortField = field;
        _sortDir = 'asc';
      }
      notify();
    },

    openCreate() {
      _modal = { mode: 'create', item: null };
      notify();
    },

    openEdit(item) {
      _modal = { mode: 'edit', item };
      notify();
    },

    openDetail(item) {
      _modal = { mode: 'detail', item };
      notify();
    },

    closeModal() {
      _modal = { mode: 'none', item: null };
      notify();
    },
  };
}

export const state = createState();

