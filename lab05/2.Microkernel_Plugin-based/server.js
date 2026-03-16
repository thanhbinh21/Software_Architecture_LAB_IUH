/**
 * HTTP SERVER — Pure Node.js (no Express)
 * Routes all API requests and serves the SPA shell.
 */
const http = require('http');
const path = require('path');
const fs = require('fs');

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function send(res, status, data) {
  const json = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(json);
}

function createServer(kernel) {
  const contentStore = kernel.services.get('content');

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost`);
    const pathname = url.pathname;
    const method = req.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE', 'Access-Control-Allow-Headers': 'Content-Type' });
      return res.end();
    }

    // Serve static files
    if (method === 'GET' && (pathname === '/' || !pathname.startsWith('/api'))) {
      const filePath = pathname === '/' ? '/index.html' : pathname;
      const fullPath = path.join(__dirname, 'public', filePath);
      if (fs.existsSync(fullPath)) {
        const ext = path.extname(fullPath);
        const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
        res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
        return fs.createReadStream(fullPath).pipe(res);
      }
      // SPA fallback
      const indexPath = path.join(__dirname, 'public', 'index.html');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return fs.createReadStream(indexPath).pipe(res);
    }

    try {
      // ── PLUGIN ROUTES ──────────────────────────────────────────
      if (pathname === '/api/plugins' && method === 'GET') {
        return send(res, 200, { plugins: kernel.listPlugins() });
      }

      if (pathname === '/api/plugins/activate' && method === 'POST') {
        const { name } = await parseBody(req);
        await kernel.activatePlugin(name);
        return send(res, 200, { success: true, plugins: kernel.listPlugins() });
      }

      if (pathname === '/api/plugins/deactivate' && method === 'POST') {
        const { name } = await parseBody(req);
        await kernel.deactivatePlugin(name);
        return send(res, 200, { success: true, plugins: kernel.listPlugins() });
      }

      // ── CONTENT ROUTES ─────────────────────────────────────────
      if (pathname === '/api/posts' && method === 'GET') {
        const posts = await contentStore.getAll();
        return send(res, 200, { posts });
      }

      if (pathname === '/api/posts' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.title || !body.body) return send(res, 400, { error: 'title and body required' });
        const post = await contentStore.create(body);
        return send(res, 201, { post });
      }

      const postMatch = pathname.match(/^\/api\/posts\/([^/]+)$/);
      if (postMatch) {
        const id = postMatch[1];
        if (method === 'GET') {
          const post = await contentStore.getById(id);
          if (!post) return send(res, 404, { error: 'Not found' });
          return send(res, 200, { post });
        }
        if (method === 'PUT') {
          const body = await parseBody(req);
          const post = await contentStore.update(id, body);
          return send(res, 200, { post });
        }
        if (method === 'DELETE') {
          const post = await contentStore.delete(id);
          return send(res, 200, { post });
        }
      }

      // ── ANALYTICS ROUTE ────────────────────────────────────────
      if (pathname === '/api/analytics' && method === 'GET') {
        if (!kernel.services.has('analytics')) {
          return send(res, 200, { active: false, message: 'Analytics plugin not active' });
        }
        const analytics = kernel.services.get('analytics');
        return send(res, 200, {
          active: true,
          stats: analytics.getStats(),
          feed: analytics.getFeed().slice(0, 20),
          topPosts: analytics.getTopPosts(),
        });
      }

      // ── KERNEL LOGS ────────────────────────────────────────────
      if (pathname === '/api/logs' && method === 'GET') {
        return send(res, 200, { logs: kernel.getLogs().slice(-30).reverse() });
      }

      send(res, 404, { error: 'Route not found' });
    } catch (err) {
      console.error('[Server Error]', err.message);
      send(res, 500, { error: err.message });
    }
  });
}

module.exports = { createServer };
