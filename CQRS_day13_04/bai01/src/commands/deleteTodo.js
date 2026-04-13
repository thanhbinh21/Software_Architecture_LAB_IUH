function deleteTodoCommand(store, id) {
  const deleted = store.delete(id);
  if (!deleted) {
    return { error: "Todo not found.", status: 404 };
  }
  return { data: null };
}

module.exports = { deleteTodoCommand };
