class TicketStore {
  constructor() {
    this.tickets = new Map();
    this.nextTicketId = 1;
  }

  bookStore(tripId, passengerName, seatNumber, price) {
    const id = "T" + String(this.nextTicketId++).padStart(3, "0");
    const now = new Date().toISOString();
    
    const ticket = {
      id,
      tripId,
      passengerName,
      seatNumber,
      price,
      status: "BOOKED",
      createdAt: now,
      updatedAt: now
    };
    this.tickets.set(id, ticket);
    return { ...ticket };
  }

  cancelTicket(id) {
    const ticket = this.tickets.get(id);
    if (!ticket) return null;
    if (ticket.status === "CANCELLED") return null;

    ticket.status = "CANCELLED";
    ticket.updatedAt = new Date().toISOString();
    return { ...ticket };
  }
}

module.exports = { TicketStore };
