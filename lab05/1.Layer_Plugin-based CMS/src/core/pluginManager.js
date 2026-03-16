/**
 * CORE - Plugin Manager
 * Central registry and lifecycle manager for all plugins
 */

class PluginManager {
  constructor() {
    this.plugins = new Map();      // id -> plugin instance
    this.hooks = new Map();        // hookName -> [{ pluginId, handler, priority }]
    this.routes = [];              // [{ method, path, handler, pluginId }]
    this.adminMenuItems = [];      // [{ label, path, icon, pluginId }]
  }

  /**
   * Register a plugin into the system
   * @param {Object} plugin - Plugin definition
   */
  register(plugin) {
    const { id, name, version, hooks = {}, routes = [], adminMenu = [] } = plugin;
    if (!id || !name) throw new Error('Plugin must have id and name');

    // Store plugin
    this.plugins.set(id, { id, name, version, enabled: false, instance: plugin });

    // Register hooks
    for (const [hookName, handler] of Object.entries(hooks)) {
      if (!this.hooks.has(hookName)) this.hooks.set(hookName, []);
      this.hooks.get(hookName).push({
        pluginId: id,
        handler,
        priority: handler.priority || 10
      });
      // Sort by priority (lower = runs first)
      this.hooks.get(hookName).sort((a, b) => a.priority - b.priority);
    }

    // Register routes
    for (const route of routes) {
      this.routes.push({ ...route, pluginId: id });
    }

    // Register admin menu items
    for (const item of adminMenu) {
      this.adminMenuItems.push({ ...item, pluginId: id });
    }

    console.log(`[PluginManager] Registered: ${name} v${version}`);
    return this;
  }

  /**
   * Enable a plugin (calls its onActivate hook)
   */
  async enable(id) {
    const plugin = this.plugins.get(id);
    if (!plugin) throw new Error(`Plugin '${id}' not found`);
    plugin.enabled = true;
    if (plugin.instance.onActivate) {
      await plugin.instance.onActivate();
    }
    console.log(`[PluginManager] Enabled: ${plugin.name}`);
  }

  /**
   * Disable a plugin (calls its onDeactivate hook)
   */
  async disable(id) {
    const plugin = this.plugins.get(id);
    if (!plugin) throw new Error(`Plugin '${id}' not found`);
    plugin.enabled = false;
    if (plugin.instance.onDeactivate) {
      await plugin.instance.onDeactivate();
    }
    console.log(`[PluginManager] Disabled: ${plugin.name}`);
  }

  /**
   * Execute all handlers for a named hook
   * Passes data through each handler (pipeline pattern)
   */
  async executeHook(hookName, data = {}) {
    const handlers = this.hooks.get(hookName) || [];
    let result = { ...data };

    for (const { pluginId, handler } of handlers) {
      const plugin = this.plugins.get(pluginId);
      if (!plugin || !plugin.enabled) continue;
      try {
        const modified = await handler(result);
        if (modified !== undefined) result = modified;
      } catch (err) {
        console.error(`[PluginManager] Hook error in ${pluginId}:${hookName}:`, err.message);
      }
    }

    return result;
  }

  /**
   * Get active admin menu items from all enabled plugins
   */
  getAdminMenuItems() {
    return this.adminMenuItems.filter(item => {
      const plugin = this.plugins.get(item.pluginId);
      return plugin && plugin.enabled;
    });
  }

  /**
   * Get all registered routes from enabled plugins
   */
  getActiveRoutes() {
    return this.routes.filter(r => {
      const plugin = this.plugins.get(r.pluginId);
      return plugin && plugin.enabled;
    });
  }

  /**
   * List all plugins with their status
   */
  listPlugins() {
    return Array.from(this.plugins.values()).map(p => ({
      id: p.id,
      name: p.name,
      version: p.version,
      enabled: p.enabled,
      hooks: [...(this.hooks.entries())]
        .filter(([, hs]) => hs.some(h => h.pluginId === p.id))
        .map(([name]) => name)
    }));
  }
}

// Singleton
module.exports = new PluginManager();
