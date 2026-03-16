/**
 * PRESENTATION LAYER - HTTP Router
 * Pure Node.js HTTP server with manual routing
 */
const http = require('http');
const url = require('url');

class Router {
  constructor() {
    this.routes = []; // { method, pattern, handler }
  }

  add(method, path, handler) {
    // Convert :param into regex capture groups
    const paramNames = [];
    const regexStr = path
      .replace(/:([a-zA-Z]+)/g, (_, name) => { paramNames.push(name); return '([^/]+)'; })
      .replace(/\//g, '\\/');
    const regex = new RegExp(`^${regexStr}$`);
    this.routes.push({ method, regex, paramNames, handler });
    return this;
  }

  get(path, handler) { return this.add('GET', path, handler); }
  post(path, handler) { return this.add('POST', path, handler); }
  put(path, handler) { return this.add('PUT', path, handler); }
  delete(path, handler) { return this.add('DELETE', path, handler); }

  async handle(req, res) {
    const parsed = url.parse(req.url, true);
    const pathname = parsed.pathname;
    req.query = parsed.query;

    for (const route of this.routes) {
      if (route.method !== req.method) continue;
      const match = pathname.match(route.regex);
      if (!match) continue;

      // Extract URL params
      req.params = {};
      route.paramNames.forEach((name, i) => { req.params[name] = match[i + 1]; });

      // Parse body
      req.body = await parseBody(req);

      // Helper methods on res
      res.json = (data, status = 200) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      };
      res.html = (content, status = 200) => {
        res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      };
      res.redirect = (location) => {
        res.writeHead(302, { Location: location });
        res.end();
      };

      try {
        await route.handler(req, res);
      } catch (err) {
        console.error('[Router Error]', err.message);
        if (!res.writableEnded) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      }
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }

  createServer() {
    return http.createServer((req, res) => this.handle(req, res));
  }
}

function parseBody(req) {
  return new Promise((resolve) => {
    if (req.method === 'GET' || req.method === 'DELETE') return resolve({});
    let data = '';
    req.on('data', chunk => { data += chunk; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try {
        const ct = req.headers['content-type'] || '';
        if (ct.includes('application/json')) return resolve(JSON.parse(data));
        if (ct.includes('application/x-www-form-urlencoded')) {
          const obj = {};
          for (const [k, v] of new URLSearchParams(data)) obj[k] = v;
          return resolve(obj);
        }
        resolve({});
      } catch { resolve({}); }
    });
  });
}

function getToken(req) {
  const cookies = req.headers.cookie || '';
  for (const part of cookies.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === 'cms_token') return v;
  }
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

module.exports = { Router, getToken };
