const { EventTypes } = require("../events/eventTypes");

/**
 * Command: Cancel an existing order.
 * Writes to the store, then emits an ORDER_CANCELLED event.
 */
function cancelOrderCommand(store, eventBus, id) {
  if (!id) {
    return { error: "Order id is required.", status: 400 };
  }

  const order = store.cancel(id);
  if (!order) {
    return { error: "Order not found or already cancelled.", status: 404 };
  }

  // --- emit event ---
  eventBus.emit(EventTypes.ORDER_CANCELLED, order);

  return { data: order };
}

module.exports = { cancelOrderCommand };
