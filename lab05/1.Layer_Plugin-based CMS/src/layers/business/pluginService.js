/**
 * BUSINESS LAYER - Plugin Service
 * Manages plugin lifecycle via Plugin Manager
 */
const db = require('../infrastructure/database');
const pluginManager = require('../../core/pluginManager');

class PluginService {
  /**
   * Sync in-memory plugins to DB and restore their enabled state
   */
  async syncPlugins() {
    const registered = pluginManager.listPlugins();
    const dbPlugins = db.getAllPlugins();

    for (const plugin of registered) {
      const existing = dbPlugins.find(p => p.id === plugin.id);
      if (!existing) {
        // First time: save to DB as disabled
        db.savePlugin({ id: plugin.id, name: plugin.name, version: plugin.version, enabled: false });
      } else if (existing.enabled) {
        // Restore enabled state from DB
        await pluginManager.enable(plugin.id);
      }
    }
  }

  /**
   * List all plugins with DB state
   */
  async listPlugins() {
    const memPlugins = pluginManager.listPlugins();
    const dbPlugins = db.getAllPlugins();

    return memPlugins.map(plugin => {
      const dbEntry = dbPlugins.find(p => p.id === plugin.id) || {};
      return {
        ...plugin,
        enabled: dbEntry.enabled || plugin.enabled,
        description: pluginManager.plugins.get(plugin.id)?.instance?.description || ''
      };
    });
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(id) {
    await pluginManager.enable(id);
    db.togglePlugin(id, true);
    return { id, enabled: true };
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(id) {
    await pluginManager.disable(id);
    db.togglePlugin(id, false);
    return { id, enabled: false };
  }

  /**
   * Get plugin details including its hooks
   */
  async getPluginDetails(id) {
    const plugin = pluginManager.plugins.get(id);
    if (!plugin) throw new Error('Plugin not found');
    const details = pluginManager.listPlugins().find(p => p.id === id);
    return details;
  }
}

module.exports = new PluginService();
