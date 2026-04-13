const { EventTypes } = require("../shared/eventBus");

class OrderReadModel {
  constructor(eventBus) {
    this.orders = new Map();

    // Consume messages from message broker
    eventBus.on(EventTypes.ORDER_CREATED, (event) => {
      this.orders.set(event.payload.id, { ...event.payload });
      console.log(`[Query-Service] Processed ORDER_CREATED from broker`);
    });

    eventBus.on(EventTypes.ORDER_CANCELLED, (event) => {
      const { id, status, updatedAt } = event.payload;
      const existing = this.orders.get(id);
      if (existing) {
        existing.status = status;
        existing.updatedAt = updatedAt;
        console.log(`[Query-Service] Processed ORDER_CANCELLED from broker`);
      }
    });
  }

  getAll() { return Array.from(this.orders.values()); }
  getById(id) { return this.orders.get(id) || null; }
}
module.exports = { OrderReadModel };
