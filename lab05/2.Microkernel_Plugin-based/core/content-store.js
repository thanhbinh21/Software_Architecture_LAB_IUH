/**
 * CONTENT STORE — Core Service
 * Simple in-memory storage for posts/pages.
 * Plugins can hook into lifecycle events via the kernel event bus.
 */
const { randomUUID } = require('crypto');

class ContentStore {
  constructor(kernel) {
    this.kernel = kernel;
    this._posts = new Map();
    this._seed();
  }

  _seed() {
    const samples = [
      { title: 'Welcome to MicroCMS', body: '## Hello World\nThis is a **plugin-based** CMS built with Microkernel architecture in Node.js.', tags: ['welcome', 'cms'] },
      { title: 'Getting Started with Plugins', body: '## Plugins\nPlugins extend the CMS without touching the core. Activate or deactivate at runtime!', tags: ['plugins', 'guide'] },
      { title: 'Microkernel Architecture', body: '## Design Pattern\nThe kernel provides only: event bus, service registry, and plugin lifecycle management.', tags: ['architecture', 'design'] },
    ];
    samples.forEach(s => this._createRaw(s));
  }

  _createRaw(data) {
    const { title, body, tags = [], ...extras } = data;
    const id = randomUUID();
    const now = new Date().toISOString();
    this._posts.set(id, { id, title, body, tags, ...extras, createdAt: now, updatedAt: now, views: 0 });
    return this._posts.get(id);
  }

  async create(data) {
    // Emit before-create so plugins can enrich/validate
    const enriched = await this.kernel.events.emitAsync('content:before-create', { ...data });
    const post = this._createRaw(enriched);
    this.kernel.events.emit('content:created', post);
    return post;
  }

  async update(id, data) {
    if (!this._posts.has(id)) throw new Error(`Post "${id}" not found`);
    const existing = this._posts.get(id);
    const merged = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    const enriched = await this.kernel.events.emitAsync('content:before-update', merged);
    this._posts.set(id, enriched);
    this.kernel.events.emit('content:updated', enriched);
    return enriched;
  }

  async delete(id) {
    if (!this._posts.has(id)) throw new Error(`Post "${id}" not found`);
    const post = this._posts.get(id);
    this._posts.delete(id);
    this.kernel.events.emit('content:deleted', post);
    return post;
  }

  async getAll() {
    return Array.from(this._posts.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getById(id) {
    const post = this._posts.get(id);
    if (!post) return null;
    post.views++;
    this.kernel.events.emit('content:viewed', post);
    return post;
  }

  count() { return this._posts.size; }
}

module.exports = { ContentStore };
