/**
 * MICROKERNEL CORE
 * Responsible for: Plugin lifecycle, Event Bus, Service Registry
 * All business logic lives in plugins — kernel stays minimal.
 */

class EventBus {
  constructor() {
    this._listeners = {};
  }

  on(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  }

  off(event, handler) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(h => h !== handler);
  }

  emit(event, ...args) {
    (this._listeners[event] || []).forEach(h => {
      try { h(...args); } catch (e) { console.error(`[EventBus] Error in handler for "${event}":`, e.message); }
    });
  }

  async emitAsync(event, data) {
    const handlers = this._listeners[event] || [];
    let result = data;
    for (const h of handlers) {
      try { result = await h(result) ?? result; } catch (e) {
        console.error(`[EventBus] Async error in "${event}":`, e.message);
      }
    }
    return result;
  }
}

class ServiceRegistry {
  constructor() {
    this._services = {};
  }

  register(name, service) {
    if (this._services[name]) throw new Error(`Service "${name}" already registered`);
    this._services[name] = service;
  }

  get(name) {
    if (!this._services[name]) throw new Error(`Service "${name}" not found`);
    return this._services[name];
  }

  has(name) {
    return !!this._services[name];
  }

  list() {
    return Object.keys(this._services);
  }

  unregister(name) {
    delete this._services[name];
  }
}

class Kernel {
  constructor() {
    this.events = new EventBus();
    this.services = new ServiceRegistry();
    this._plugins = new Map();   // name -> { meta, instance, status }
    this._log = [];
  }

  // ── Plugin Lifecycle ──────────────────────────────────────────
  async registerPlugin(PluginClass) {
    const meta = PluginClass.meta;
    if (!meta || !meta.name) throw new Error('Plugin must define static meta.name');
    if (this._plugins.has(meta.name)) {
      throw new Error(`Plugin "${meta.name}" already registered`);
    }

    const instance = new PluginClass(this);
    this._plugins.set(meta.name, { meta, instance, status: 'registered', registeredAt: new Date() });
    this._logEvent('REGISTER', meta.name);
    this.events.emit('plugin:registered', meta);
    return this;
  }

  async activatePlugin(name) {
    const entry = this._plugins.get(name);
    if (!entry) throw new Error(`Plugin "${name}" not found`);
    if (entry.status === 'active') throw new Error(`Plugin "${name}" already active`);

    // Check dependencies
    for (const dep of (entry.meta.dependencies || [])) {
      const dep_entry = this._plugins.get(dep);
      if (!dep_entry || dep_entry.status !== 'active') {
        throw new Error(`Plugin "${name}" requires "${dep}" to be active first`);
      }
    }

    await entry.instance.activate();
    entry.status = 'active';
    entry.activatedAt = new Date();
    this._logEvent('ACTIVATE', name);
    this.events.emit('plugin:activated', entry.meta);
  }

  async deactivatePlugin(name) {
    const entry = this._plugins.get(name);
    if (!entry) throw new Error(`Plugin "${name}" not found`);
    if (entry.status !== 'active') throw new Error(`Plugin "${name}" is not active`);

    // Check if others depend on this
    for (const [pName, pEntry] of this._plugins) {
      if (pEntry.status === 'active' && (pEntry.meta.dependencies || []).includes(name)) {
        throw new Error(`Cannot deactivate "${name}": plugin "${pName}" depends on it`);
      }
    }

    await entry.instance.deactivate();
    entry.status = 'inactive';
    entry.deactivatedAt = new Date();
    this._logEvent('DEACTIVATE', name);
    this.events.emit('plugin:deactivated', entry.meta);
  }

  // ── Introspection ─────────────────────────────────────────────
  getPlugin(name) {
    return this._plugins.get(name);
  }

  listPlugins() {
    return Array.from(this._plugins.values()).map(({ meta, status, registeredAt, activatedAt }) => ({
      ...meta, status, registeredAt, activatedAt
    }));
  }

  getActivePlugins() {
    return this.listPlugins().filter(p => p.status === 'active');
  }

  getLogs() {
    return [...this._log];
  }

  _logEvent(action, plugin) {
    this._log.push({ action, plugin, timestamp: new Date().toISOString() });
    if (this._log.length > 200) this._log.shift();
  }
}

module.exports = { Kernel, EventBus, ServiceRegistry };
