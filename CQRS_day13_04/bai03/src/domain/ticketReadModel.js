const { EventTypes } = require("../events/eventTypes");

class TicketReadModel {
  constructor(eventBus) {
    this.tickets = new Map();

    eventBus.on(EventTypes.TICKET_BOOKED, (event) => this._onBooked(event));
    eventBus.on(EventTypes.TICKET_CANCELLED, (event) => this._onCancelled(event));
  }

  _onBooked(event) {
    const ticket = event.payload;
    this.tickets.set(ticket.id, { ...ticket });
  }

  _onCancelled(event) {
    const { id, status, updatedAt } = event.payload;
    const existing = this.tickets.get(id);
    if (existing) {
      existing.status = status;
      existing.updatedAt = updatedAt;
    }
  }

  getAllTickets() {
    return Array.from(this.tickets.values());
  }
}

module.exports = { TicketReadModel };
