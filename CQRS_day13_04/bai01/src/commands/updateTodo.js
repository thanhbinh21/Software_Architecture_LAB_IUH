function updateTodoCommand(store, id, payload) {
  const patch = {};

  if (Object.prototype.hasOwnProperty.call(payload, "title")) {
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    if (!title) {
      return { error: "Field 'title' must be a non-empty string." };
    }
    patch.title = title;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "completed")) {
    if (typeof payload.completed !== "boolean") {
      return { error: "Field 'completed' must be a boolean." };
    }
    patch.completed = payload.completed;
  }

  if (Object.keys(patch).length === 0) {
    return { error: "At least one of 'title' or 'completed' is required." };
  }

  const updated = store.update(id, patch);
  if (!updated) {
    return { error: "Todo not found.", status: 404 };
  }
  return { data: updated };
}

module.exports = { updateTodoCommand };
