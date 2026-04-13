/**
 * OrderReadModel – query-side projection that is updated by listening to events.
 * This demonstrates CQRS separation: the read model is built from events,
 * not by directly querying the write store.
 */
const { EventTypes } = require("../events/eventTypes");

class OrderReadModel {
  constructor(eventBus) {
    /** @type {Map<string, object>} */
    this.orders = new Map();

    // Subscribe to events and project them into the read model
    eventBus.on(EventTypes.ORDER_CREATED, (event) => this._onOrderCreated(event));
    eventBus.on(EventTypes.ORDER_CANCELLED, (event) => this._onOrderCancelled(event));
  }

  _onOrderCreated(event) {
    const order = event.payload;
    this.orders.set(order.id, { ...order });
  }

  _onOrderCancelled(event) {
    const { id, status, updatedAt } = event.payload;
    const existing = this.orders.get(id);
    if (existing) {
      existing.status = status;
      existing.updatedAt = updatedAt;
    }
  }

  /**
   * Query: get all orders.
   */
  getAll() {
    return Array.from(this.orders.values());
  }

  /**
   * Query: get order by id.
   */
  getById(id) {
    return this.orders.get(id) || null;
  }
}

module.exports = { OrderReadModel };
