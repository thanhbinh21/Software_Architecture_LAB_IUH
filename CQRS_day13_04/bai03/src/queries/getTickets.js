function getTicketsQuery(readModel) {
  return { data: readModel.getAllTickets() };
}

module.exports = { getTicketsQuery };
