class OrderStore {
  constructor() {
    this.orders = new Map();
    this.nextId = 1;
  }

  create({ customerName, items }) {
    const id = String(this.nextId++);
    const now = new Date().toISOString();
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = {
      id, customerName,
      items: items.map(i => ({ ...i })),
      totalAmount,
      status: "PENDING",
      createdAt: now, updatedAt: now
    };
    this.orders.set(id, order);
    return { ...order };
  }

  cancel(id) {
    const order = this.orders.get(id);
    if (!order || order.status === "CANCELLED") return null;
    order.status = "CANCELLED";
    order.updatedAt = new Date().toISOString();
    return { ...order };
  }
}
module.exports = { OrderStore };
