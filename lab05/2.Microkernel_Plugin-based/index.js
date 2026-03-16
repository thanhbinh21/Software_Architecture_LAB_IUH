/**
 * ENTRY POINT
 * Bootstraps kernel, registers plugins, starts HTTP server.
 */
const { Kernel } = require('./core/kernel');
const { ContentStore } = require('./core/content-store');
const { createServer } = require('./server');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

async function loadPlugins(kernel) {
  const pluginsDir = path.join(__dirname, 'plugins');
  const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });

  const pluginClasses = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pluginPath = path.join(pluginsDir, entry.name, 'index.js');
    if (!fs.existsSync(pluginPath)) continue;

    // Require plugin modules dynamically so new plugins can be dropped in without changing bootstrap.
    const PluginClass = require(pluginPath);
    if (!PluginClass?.meta?.name) {
      console.warn(`⚠️  Skipped plugin at "${entry.name}": missing static meta.name`);
      continue;
    }
    pluginClasses.push(PluginClass);
  }

  // Register all discovered plugins.
  for (const PluginClass of pluginClasses) {
    await kernel.registerPlugin(PluginClass);
  }
}

async function activatePluginsRespectingDependencies(kernel) {
  const pending = new Set(kernel.listPlugins().map(p => p.name));

  while (pending.size > 0) {
    let activatedThisRound = 0;

    for (const name of [...pending]) {
      const plugin = kernel.getPlugin(name);
      const deps = plugin?.meta?.dependencies || [];
      const ready = deps.every(dep => {
        const depPlugin = kernel.getPlugin(dep);
        return depPlugin && depPlugin.status === 'active';
      });

      if (!ready) continue;
      await kernel.activatePlugin(name);
      pending.delete(name);
      activatedThisRound++;
    }

    if (activatedThisRound === 0) {
      throw new Error(`Cannot resolve plugin dependencies for: ${[...pending].join(', ')}`);
    }
  }
}

async function bootstrap() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   MicroCMS — Microkernel Architecture  ║');
  console.log('╚══════════════════════════════════════╝\n');

  // 1. Boot kernel
  const kernel = new Kernel();
  console.log('✅ Kernel booted');

  // 2. Register core service (not a plugin — always available)
  const contentStore = new ContentStore(kernel);
  kernel.services.register('content', contentStore);
  console.log('✅ ContentStore registered as core service');

  // 3. Auto-discover and register plugins (not yet active)
  await loadPlugins(kernel);
  console.log(`✅ ${kernel.listPlugins().length} plugins registered\n`);

  // 4. Activate discovered plugins by default (dependency-aware)
  await activatePluginsRespectingDependencies(kernel);
  console.log('');

  // 5. Start HTTP server
  const server = createServer(kernel);
  server.listen(PORT, () => {
    console.log(`\n🚀 MicroCMS running at http://localhost:${PORT}`);
    console.log(`\n📋 Active plugins: ${kernel.getActivePlugins().map(p => p.displayName).join(', ')}`);
    console.log('\nPress Ctrl+C to stop.\n');
  });
}

bootstrap().catch(err => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
