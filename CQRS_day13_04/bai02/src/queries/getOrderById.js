/**
 * Query: Get a single order by id from the READ model.
 */
function getOrderByIdQuery(readModel, id) {
  const order = readModel.getById(id);
  if (!order) {
    return { error: "Order not found.", status: 404 };
  }
  return { data: order };
}

module.exports = { getOrderByIdQuery };
