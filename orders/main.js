import { fetchOrders } from "./data/orders.js";
import "./components/order-card.js";

const LIST_ID = "orders-list";
const SKELETON_ID = "skeleton-list";
const ERROR_ID = "error-banner";

/**
 * Render all orders into the list container.
 * @param {import('./data/orders.js').Order[]} orders
 */
function renderOrders(orders) {
  const list = document.getElementById(LIST_ID);
  list.replaceChildren();

  if (orders.length === 0) {
    renderEmpty(list);
    return;
  }

  orders.forEach((order, index) => {
    const card = document.createElement("order-card");
    card.style.animationDelay = `${index * 60}ms`;
    card.classList.add("card-enter");
    list.appendChild(card);
    card.setOrder(order);
  });
}

/**
 * Show an empty-state message.
 * @param {HTMLElement} container
 */
function renderEmpty(container) {
  const msg = document.createElement("p");
  msg.className = "empty-state";
  msg.textContent = "No orders found.";
  container.appendChild(msg);
}

/** Show loading skeleton, hide list. */
function showLoading() {
  document.getElementById(SKELETON_ID).hidden = false;
  document.getElementById(LIST_ID).hidden = true;
  document.getElementById(ERROR_ID).hidden = true;
}

/** Hide loading skeleton, show list. */
function hideLoading() {
  document.getElementById(SKELETON_ID).remove();
  document.getElementById(ERROR_ID).remove();
  document.getElementById(LIST_ID).hidden = false;
}

/** Show an error message. */
function showError(message) {
  document.getElementById(SKELETON_ID).hidden = true;
  const banner = document.getElementById(ERROR_ID);
  banner.hidden = false;
  banner.querySelector(".error-text").textContent = message;
}

/** Main entry point. */
async function init() {
  showLoading();
  try {
    const orders = await fetchOrders();
    renderOrders(orders);
    hideLoading();
  } catch (err) {
    console.error("Failed to load orders:", err);
    hideLoading();
    showError("Unable to load your orders. Please try again later.");
  }
}

init();
