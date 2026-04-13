class TodoStore {
  constructor() {
    this.todos = new Map();
    this.nextId = 1;
  }

  create({ title, completed = false }) {
    const id = String(this.nextId++);
    const now = new Date().toISOString();
    const todo = {
      id,
      title,
      completed: Boolean(completed),
      createdAt: now,
      updatedAt: now
    };
    this.todos.set(id, todo);
    return todo;
  }

  update(id, patch) {
    const existing = this.todos.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date().toISOString()
    };
    this.todos.set(id, updated);
    return updated;
  }

  delete(id) {
    return this.todos.delete(id);
  }

  getById(id) {
    return this.todos.get(id) || null;
  }

  getAll() {
    return Array.from(this.todos.values());
  }
}

module.exports = { TodoStore };
