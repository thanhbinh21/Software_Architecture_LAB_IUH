const { EventTypes } = require("../events/eventTypes");

/**
 * Command: Create a new order.
 * Validates input, writes to the store, then emits an ORDER_CREATED event.
 */
function createOrderCommand(store, eventBus, payload) {
  // --- validation ---
  const customerName =
    typeof payload?.customerName === "string" ? payload.customerName.trim() : "";
  if (!customerName) {
    return { error: "Field 'customerName' is required." };
  }

  const items = Array.isArray(payload?.items) ? payload.items : [];
  if (items.length === 0) {
    return { error: "At least one item is required." };
  }

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it.name || typeof it.name !== "string") {
      return { error: `Item ${i}: 'name' is required.` };
    }
    if (typeof it.quantity !== "number" || it.quantity <= 0) {
      return { error: `Item ${i}: 'quantity' must be a positive number.` };
    }
    if (typeof it.price !== "number" || it.price < 0) {
      return { error: `Item ${i}: 'price' must be a non-negative number.` };
    }
  }

  // --- write ---
  const order = store.create({ customerName, items });

  // --- emit event ---
  eventBus.emit(EventTypes.ORDER_CREATED, order);

  return { data: order };
}

module.exports = { createOrderCommand };
