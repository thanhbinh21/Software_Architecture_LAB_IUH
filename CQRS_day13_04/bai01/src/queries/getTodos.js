function getTodosQuery(store) {
  return { data: store.getAll() };
}

module.exports = { getTodosQuery };
