/**
 * Shared utility functions for formatting display values.
 */

/**
 * Format a number as currency (USD).
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format an ISO date string into a human-readable date.
 * @param {string} isoString
 * @returns {string}
 */
export function formatDate(isoString) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(isoString));
}

/**
 * Pluralise a word based on count.
 * @param {number} count
 * @param {string} singular
 * @param {string} [plural]
 * @returns {string}
 */
export function pluralise(count, singular, plural) {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}

/**
 * Compute the total price for an array of order items.
 * @param {{ price: number; quantity: number }[]} items
 * @returns {number}
 */
export function computeOrderTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

