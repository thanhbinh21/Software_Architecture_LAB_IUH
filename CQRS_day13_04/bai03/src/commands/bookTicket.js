const { EventTypes } = require("../events/eventTypes");

function bookTicketCommand(store, eventBus, payload) {
  const { tripId, passengerName, seatNumber, price } = payload || {};

  if (!tripId || !passengerName || !seatNumber || price == null) {
    return { error: "Missing required booking fields (tripId, passengerName, seatNumber, price)." };
  }

  const ticket = store.bookStore(tripId, passengerName, seatNumber, parseFloat(price));
  eventBus.emit(EventTypes.TICKET_BOOKED, ticket);
  return { data: ticket };
}

module.exports = { bookTicketCommand };
