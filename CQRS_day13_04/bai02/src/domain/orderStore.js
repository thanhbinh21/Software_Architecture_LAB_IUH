/**
 * OrderStore – in-memory write store for orders.
 * The command side writes here; the query side reads through a read model.
 */
class OrderStore {
  constructor() {
    /** @type {Map<string, object>} */
    this.orders = new Map();
    this.nextId = 1;
  }

  /**
   * Create a new order.
   * @param {{ customerName: string, items: Array<{name: string, quantity: number, price: number}> }} data
   * @returns {object} the created order
   */
  create({ customerName, items }) {
    const id = String(this.nextId++);
    const now = new Date().toISOString();

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = {
      id,
      customerName,
      items: items.map(i => ({ ...i })),
      totalAmount,
      status: "PENDING",
      createdAt: now,
      updatedAt: now
    };

    this.orders.set(id, order);
    return { ...order };
  }

  /**
   * Cancel an order by id.
   * @param {string} id
   * @returns {object|null}
   */
  cancel(id) {
    const order = this.orders.get(id);
    if (!order) return null;
    if (order.status === "CANCELLED") return null;

    order.status = "CANCELLED";
    order.updatedAt = new Date().toISOString();
    return { ...order };
  }

  /**
   * Get a single order by id.
   */
  getById(id) {
    const order = this.orders.get(id);
    return order ? { ...order } : null;
  }

  /**
   * Get all orders.
   */
  getAll() {
    return Array.from(this.orders.values()).map(o => ({ ...o }));
  }
}

module.exports = { OrderStore };
