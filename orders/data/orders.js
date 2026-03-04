/**
 * Simulated order data source.
 * In a real app, this would be fetched from an API.
 */

/** @typedef {'completed'|'pending'|'cancelled'|'processing'} OrderStatus */

/**
 * @typedef {Object} OrderItem
 * @property {string} id
 * @property {string} name
 * @property {number} price
 * @property {number} quantity
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} date
 * @property {OrderStatus} status
 * @property {OrderItem[]} items
 */

/** @type {Order[]} */
export const ORDERS = [
  {
    id: "ORD-2024-0091",
    date: "2024-11-18T09:14:00Z",
    status: "completed",
    items: [
      { id: "item-1", name: "Mechanical Keyboard — TKL Carbon", price: 149.99, quantity: 1 },
      { id: "item-2", name: "USB-C Hub 7-in-1", price: 44.95, quantity: 2 },
      { id: "item-3", name: "Desk Mat XL (900×400mm)", price: 29.00, quantity: 1 },
    ],
  },
  {
    id: "ORD-2024-0087",
    date: "2024-11-10T15:30:00Z",
    status: "processing",
    items: [
      { id: "item-4", name: "Wireless Earbuds Pro", price: 89.00, quantity: 1 },
      { id: "item-5", name: "Leather Cable Organiser", price: 18.50, quantity: 3 },
    ],
  },
  {
    id: "ORD-2024-0074",
    date: "2024-10-29T11:05:00Z",
    status: "pending",
    items: [
      { id: "item-6", name: "Monitor Stand — Bamboo", price: 62.00, quantity: 1 },
      { id: "item-7", name: "Webcam HD 1080p", price: 75.49, quantity: 1 },
      { id: "item-8", name: "Microphone Arm Clamp", price: 22.00, quantity: 1 },
      { id: "item-9", name: "Cable Clips (pack of 10)", price: 9.95, quantity: 2 },
    ],
  },
  {
    id: "ORD-2024-0058",
    date: "2024-10-03T08:55:00Z",
    status: "cancelled",
    items: [
      { id: "item-10", name: "Ergonomic Mouse", price: 55.00, quantity: 1 },
      { id: "item-11", name: "Mouse Bungee", price: 14.99, quantity: 1 },
    ],
  },
  {
    id: "ORD-2024-0041",
    date: "2024-09-14T17:20:00Z",
    status: "completed",
    items: [
      { id: "item-12", name: "Standing Desk Converter", price: 199.00, quantity: 1 },
      { id: "item-13", name: "Anti-Fatigue Mat", price: 49.95, quantity: 1 },
      { id: "item-14", name: "Monitor Riser", price: 34.00, quantity: 2 },
      { id: "item-15", name: "Pen Holder — Walnut", price: 27.50, quantity: 1 },
    ],
  },
];

/**
 * Simulate an async API fetch with artificial delay.
 * @param {number} [delayMs=600]
 * @returns {Promise<Order[]>}
 */
export async function fetchOrders(delayMs = 600) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ORDERS), delayMs);
  });
}

