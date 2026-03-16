/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║          PLUGIN-BASED CMS — LAYERED ARCHITECTURE         ║
 * ║                                                          ║
 * ║  Presentation  →  Business  →  Infrastructure            ║
 * ║       ↕                                                  ║
 * ║  Plugin Manager (hooks into Business layer)              ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * 3 Core Features:
 *   1. Post Management  — CRUD with status, tags, slug
 *   2. User Auth        — Register, login, sessions, roles
 *   3. Plugin Manager   — Hook-based plugin lifecycle
 *
 * Built-in Plugins:
 *   • SEO Optimizer     — Injects meta tags via before_post_save hook
 *   • Analytics Tracker — Tracks views via post_view hook
 */

const { Router } = require('./layers/presentation/router');
const { requireAuth, compose } = require('./layers/presentation/middleware');
const ctrl = require('./layers/presentation/controllers');
const pluginManager = require('./core/pluginManager');
const pluginService = require('./layers/business/pluginService');
const authService = require('./layers/business/authService');

// ── 1. REGISTER PLUGINS ──────────────────────────────────────────────────────
const seoPlugin = require('./plugins/seo-plugin');
const analyticsPlugin = require('./plugins/analytics-plugin');

pluginManager.register(seoPlugin);
pluginManager.register(analyticsPlugin);

// ── 2. SETUP ROUTER ──────────────────────────────────────────────────────────
const router = new Router();

const auth = requireAuth();
const adminOnly = requireAuth(['admin']);

// Public routes
router.get('/login', ctrl.showLogin);
router.post('/login', ctrl.doLogin);
router.get('/logout', ctrl.doLogout);

// Root redirect
router.get('/', async (req, res) => res.redirect('/admin'));

// ── Dashboard
router.get('/admin', compose(auth, ctrl.showDashboard));

// ── Post Management
router.get('/admin/posts',             compose(auth, ctrl.listPosts));
router.get('/admin/posts/new',         compose(auth, ctrl.showNewPostForm));
router.post('/admin/posts/new',        compose(auth, ctrl.createPost));
router.get('/admin/posts/:id',         compose(auth, ctrl.showPost));
router.get('/admin/posts/:id/edit',    compose(auth, ctrl.showEditForm));
router.post('/admin/posts/:id/edit',   compose(auth, ctrl.updatePost));
router.post('/admin/posts/:id/delete', compose(auth, ctrl.deletePost));
router.post('/admin/posts/:id/toggle', compose(auth, ctrl.togglePost));

// ── Plugin Manager (admin only)
router.get('/admin/plugins',                    compose(adminOnly, ctrl.listPlugins));
router.post('/admin/plugins/:id/enable',        compose(adminOnly, ctrl.enablePlugin));
router.post('/admin/plugins/:id/disable',       compose(adminOnly, ctrl.disablePlugin));

// ── User Auth Management (admin only)
router.get('/admin/users',      compose(adminOnly, ctrl.listUsers));
router.get('/admin/users/new',  compose(adminOnly, ctrl.showAddUser));
router.post('/admin/users/new', compose(adminOnly, ctrl.createUser));

// ── 3. BOOTSTRAP ─────────────────────────────────────────────────────────────
async function bootstrap() {
  console.log('\n╔════════════════════════════════╗');
  console.log('║      PLUGIN CMS BOOTING        ║');
  console.log('╚════════════════════════════════╝\n');

  // Seed default admin user
  await authService.seedAdmin();

  // Restore plugin state from DB
  await pluginService.syncPlugins();

  // Start server
  const PORT = process.env.PORT || 3000;
  const server = router.createServer();
  server.listen(PORT, () => {
    console.log(`\n✅ CMS running at http://localhost:${PORT}`);
    console.log('─────────────────────────────────');
    console.log('  Admin:    http://localhost:' + PORT + '/admin');
    console.log('  Login:    admin@cms.local');
    console.log('  Password: admin123');
    console.log('─────────────────────────────────');
    console.log('\n📐 Architecture Layers:');
    console.log('  Presentation  →  src/layers/presentation/');
    console.log('  Business      →  src/layers/business/');
    console.log('  Infrastructure→  src/layers/infrastructure/');
    console.log('  Plugins       →  src/plugins/');
    console.log('\n🔌 Registered Plugins:', pluginManager.listPlugins().map(p => p.name).join(', '));
    console.log('\nGo to /admin → Plugins to enable SEO & Analytics\n');
  });
}

bootstrap().catch(err => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
