/**
 * BASE PLUGIN CLASS
 * All plugins extend this. Provides access to kernel via this.kernel.
 */
class BasePlugin {
  constructor(kernel) {
    this.kernel = kernel;
  }

  // Subclasses override these
  async activate() {}
  async deactivate() {}
}

module.exports = { BasePlugin };
