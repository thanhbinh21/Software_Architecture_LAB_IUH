/**
 * Query: Get all orders from the READ model (not the write store).
 */
function getOrdersQuery(readModel) {
  return { data: readModel.getAll() };
}

module.exports = { getOrdersQuery };
