function getTodoByIdQuery(store, id) {
  const todo = store.getById(id);
  if (!todo) {
    return { error: "Todo not found.", status: 404 };
  }
  return { data: todo };
}

module.exports = { getTodoByIdQuery };
