const { EventTypes } = require("../events/eventTypes");

function cancelTicketCommand(store, eventBus, id) {
  if (!id) {
    return { error: "Ticket ID is required.", status: 400 };
  }

  const ticket = store.cancelTicket(id);
  if (!ticket) {
    return { error: "Ticket not found or already cancelled.", status: 404 };
  }

  eventBus.emit(EventTypes.TICKET_CANCELLED, ticket);
  return { data: ticket };
}

module.exports = { cancelTicketCommand };
