// ui.js — DOM rendering and event delegation

import { state } from './state.js';

/* ─── Helpers ───────────────────────────────────────────────────── */

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(val, type) {
  if (type === 'price') return `$${Number(val).toFixed(2)}`;
  if (type === 'date') {
    const d = new Date(val);
    return isNaN(d) ? '—' : d.toLocaleString();
  }
  return String(val ?? '—');
}

function el(tag, attrs = {}, ...children) {
  const elem = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on') && typeof v === 'function') {
      elem.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'className') {
      elem.className = v;
    } else {
      elem.setAttribute(k, v);
    }
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    elem.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return elem;
}

/* ─── Toast ─────────────────────────────────────────────────────── */

let _toastTimer;
export function toast(message, type = 'error') {
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.className = `toast toast--${type} toast--visible`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toastEl.classList.remove('toast--visible');
  }, 4000);
}

/* ─── Header & Toolbar ──────────────────────────────────────────── */

export function renderToolbar(container, { onSearch, onCreateClick }) {
  container.innerHTML = '';

  const searchInput = el('input', {
    type: 'search',
    className: 'toolbar__search',
    placeholder: 'Search items…',
    'aria-label': 'Filter inventory',
    oninput: (e) => onSearch(e.target.value),
  });

  const createBtn = el(
    'button',
    { className: 'btn btn--primary', onClick: onCreateClick, 'aria-label': 'Add new item' },
    el('span', { 'aria-hidden': 'true' }, '＋'),
    ' NEW ITEM',
  );

  container.append(searchInput, createBtn);
}

/* ─── Table ─────────────────────────────────────────────────────── */

const COLUMNS = [
  { key: 'name', label: 'NAME', sortable: true },
  { key: 'description', label: 'DESCRIPTION', sortable: false },
  { key: 'quantity', label: 'QTY', sortable: true },
  { key: 'price', label: 'PRICE', sortable: true },
  { key: 'lastUpdated', label: 'LAST UPDATED', sortable: true },
  { key: '_actions', label: '', sortable: false },
];

export function renderTable(container, { items, sortField, sortDir, onSort }) {
  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <span class="empty-state__icon">◻</span>
      <p>No inventory items found.</p>
      <p class="empty-state__sub">Add an item or adjust your search.</p>
    </div>`;
    return;
  }

  const thead = el(
    'thead',
    {},
    el(
      'tr',
      {},
      ...COLUMNS.map((col) => {
        const isSort = col.sortable && col.key === sortField;
        const arrow = isSort ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';
        return el(
          'th',
          {
            className: `th ${col.sortable ? 'th--sortable' : ''} ${isSort ? 'th--active' : ''}`,
            ...(col.sortable ? { onClick: () => onSort(col.key) } : {}),
            scope: 'col',
          },
          col.label + arrow,
        );
      }),
    ),
  );

  const tbody = el(
    'tbody',
    { id: 'table-body' },
    ...items.map((item) =>
      el(
        'tr',
        { className: 'item-row', 'data-id': item.id },
        el('td', { className: 'td td--name' }, esc(item.name)),
        el('td', { className: 'td td--desc' }, esc(item.description)),
        el(
          'td',
          {
            className: `td td--qty ${item.quantity <= 0 ? 'td--qty-zero' : item.quantity < 10 ? 'td--qty-low' : ''}`,
          },
          fmt(item.quantity),
        ),
        el('td', { className: 'td td--price' }, fmt(item.price, 'price')),
        el('td', { className: 'td td--date' }, fmt(item.lastUpdated, 'date')),
        el(
          'td',
          { className: 'td td--actions' },
          el('button', { className: 'action-btn action-btn--view', 'data-action': 'view', 'data-id': item.id, title: 'View details' }, '◉'),
          el('button', { className: 'action-btn action-btn--edit', 'data-action': 'edit', 'data-id': item.id, title: 'Edit item' }, '✎'),
          el('button', { className: 'action-btn action-btn--delete', 'data-action': 'delete', 'data-id': item.id, title: 'Delete item' }, '✕'),
        ),
      ),
    ),
  );

  const table = el('table', { className: 'data-table', role: 'grid' }, thead, tbody);
  container.append(table);
}

/* ─── Loading & Error overlays ──────────────────────────────────── */

export function renderLoading(container, visible) {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = el('div', { id: 'loading-overlay', className: 'loading-overlay', role: 'status', 'aria-live': 'polite' },
      el('div', { className: 'spinner' }),
      el('span', {}, 'LOADING…'),
    );
    container.append(overlay);
  }
  overlay.classList.toggle('loading-overlay--visible', visible);
}

export function renderError(container, message) {
  let bar = document.getElementById('error-bar');
  if (!bar) {
    bar = el('div', { id: 'error-bar', className: 'error-bar', role: 'alert' });
    container.prepend(bar);
  }
  if (message) {
    bar.textContent = `⚠ ${message}`;
    bar.classList.add('error-bar--visible');
  } else {
    bar.classList.remove('error-bar--visible');
  }
}

/* ─── Item count badge ──────────────────────────────────────────── */
export function renderStats(container, items) {
  const total = items.length;
  const totalQty = items.reduce((s, i) => s + Number(i.quantity ?? 0), 0);
  const totalValue = items.reduce((s, i) => s + Number(i.price ?? 0) * Number(i.quantity ?? 0), 0);
  container.innerHTML = `
    <span class="stat"><span class="stat__label">ITEMS</span><span class="stat__value">${total}</span></span>
    <span class="stat"><span class="stat__label">TOTAL QTY</span><span class="stat__value">${totalQty}</span></span>
    <span class="stat"><span class="stat__label">TOTAL VALUE</span><span class="stat__value">$${totalValue.toFixed(2)}</span></span>
  `;
}

/* ─── Modal ─────────────────────────────────────────────────────── */

function validateForm(data) {
  const errors = {};
  if (!data.name || data.name.trim().length < 1) errors.name = 'Name is required.';
  if (data.name && data.name.trim().length > 120) errors.name = 'Name must be ≤ 120 chars.';
  if (data.quantity === '' || isNaN(Number(data.quantity)) || Number(data.quantity) < 0)
    errors.quantity = 'Quantity must be a non-negative integer.';
  if (!Number.isInteger(Number(data.quantity))) errors.quantity = 'Quantity must be a whole number.';
  if (data.price === '' || isNaN(Number(data.price)) || Number(data.price) < 0)
    errors.price = 'Price must be a non-negative number.';
  return errors;
}

function buildFormFields(item) {
  const fields = [
    { key: 'name', label: 'NAME', type: 'text', required: true, value: item?.name ?? '' },
    { key: 'description', label: 'DESCRIPTION', type: 'textarea', value: item?.description ?? '' },
    { key: 'quantity', label: 'QUANTITY', type: 'number', required: true, min: '0', step: '1', value: item?.quantity ?? '' },
    { key: 'price', label: 'PRICE ($)', type: 'number', required: true, min: '0', step: '0.01', value: item?.price ?? '' },
  ];

  return fields.map(({ key, label, type, required, ...rest }) => {
    const inputEl = type === 'textarea'
      ? el('textarea', { id: `field-${key}`, className: 'form__input form__input--textarea', name: key, rows: '3' }, String(rest.value))
      : el('input', { id: `field-${key}`, className: 'form__input', type, name: key, value: String(rest.value), ...(required ? { required: '' } : {}), ...rest });

    return el(
      'div',
      { className: 'form__group' },
      el('label', { className: 'form__label', for: `field-${key}` }, label + (required ? ' *' : '')),
      inputEl,
      el('span', { className: 'form__error', id: `error-${key}`, role: 'alert' }),
    );
  });
}

function clearFieldErrors() {
  document.querySelectorAll('.form__error').forEach((e) => (e.textContent = ''));
  document.querySelectorAll('.form__input--invalid').forEach((e) => e.classList.remove('form__input--invalid'));
}

function showFieldErrors(errors) {
  for (const [key, msg] of Object.entries(errors)) {
    const errEl = document.getElementById(`error-${key}`);
    const inputEl = document.getElementById(`field-${key}`);
    if (errEl) errEl.textContent = msg;
    if (inputEl) inputEl.classList.add('form__input--invalid');
  }
}

export function renderModal(container, { mode, item, onSave, onClose }) {
  // Remove existing modal
  document.getElementById('modal-backdrop')?.remove();

  if (mode === 'none') return;

  const isDetail = mode === 'detail';
  const isEdit = mode === 'edit';
  const title = mode === 'create' ? 'NEW ITEM' : isEdit ? 'EDIT ITEM' : 'ITEM DETAILS';

  let content;

  if (isDetail) {
    content = el(
      'dl',
      { className: 'detail-list' },
      ...['id', 'name', 'description', 'quantity', 'price', 'lastUpdated'].flatMap((key) => {
        const labels = { id: 'ID', name: 'NAME', description: 'DESCRIPTION', quantity: 'QUANTITY', price: 'PRICE', lastUpdated: 'LAST UPDATED' };
        let val = item[key];
        if (key === 'price') val = fmt(val, 'price');
        else if (key === 'lastUpdated') val = fmt(val, 'date');
        return [
          el('dt', { className: 'detail-list__key' }, labels[key]),
          el('dd', { className: 'detail-list__val' }, esc(val)),
        ];
      }),
    );
  } else {
    content = el('form', { id: 'item-form', className: 'form', novalidate: '' }, ...buildFormFields(item));
  }

  const footerBtns = isDetail
    ? [el('button', { className: 'btn btn--secondary', onClick: onClose }, 'CLOSE')]
    : [
        el('button', { type: 'button', className: 'btn btn--secondary', onClick: onClose }, 'CANCEL'),
        el('button', { type: 'button', className: 'btn btn--primary', id: 'modal-save-btn', onClick: handleSave }, 'SAVE'),
      ];

  const modal = el(
    'div',
    { className: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'modal-title' },
    el(
      'header',
      { className: 'modal__header' },
      el('h2', { className: 'modal__title', id: 'modal-title' }, title),
      el('button', { className: 'modal__close', onClick: onClose, 'aria-label': 'Close modal' }, '✕'),
    ),
    el('div', { className: 'modal__body' }, content),
    el('footer', { className: 'modal__footer' }, ...footerBtns),
  );

  const backdrop = el('div', { id: 'modal-backdrop', className: 'modal-backdrop', onClick: (e) => { if (e.target === backdrop) onClose(); } }, modal);
  container.append(backdrop);

  // Focus first input
  setTimeout(() => {
    const first = modal.querySelector('input, textarea, button');
    first?.focus();
  }, 50);

  function handleSave() {
    clearFieldErrors();
    const formEl = document.getElementById('item-form');
    if (!formEl) return;

    const fd = new FormData(formEl);
    const data = Object.fromEntries(fd.entries());

    const errors = validateForm(data);
    if (Object.keys(errors).length) {
      showFieldErrors(errors);
      return;
    }

    const saveBtn = document.getElementById('modal-save-btn');
    if (saveBtn) saveBtn.disabled = true;

    const payload = {
      name: data.name.trim(),
      description: data.description?.trim() ?? '',
      quantity: parseInt(data.quantity, 10),
      price: parseFloat(Number(data.price).toFixed(2)),
    };

    onSave(payload, () => { if (saveBtn) saveBtn.disabled = false; });
  }
}

