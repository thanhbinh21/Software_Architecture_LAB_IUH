function createTodoCommand(store, payload) {
  const title = typeof payload?.title === "string" ? payload.title.trim() : "";
  if (!title) {
    return { error: "Field 'title' is required." };
  }

  const todo = store.create({
    title,
    completed: Boolean(payload?.completed)
  });

  return { data: todo };
}

module.exports = { createTodoCommand };
