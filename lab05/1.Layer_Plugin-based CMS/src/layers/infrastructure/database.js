/**
 * INFRASTRUCTURE LAYER - Database
 * Lightweight JSON-based persistence (no external deps)
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../../data/db.json');

function ensureDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      users: [],
      posts: [],
      plugins: [],
      sessions: {}
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  }
}

function read() {
  ensureDB();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function write(data) {
  ensureDB();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

class Database {
  // ─── USERS ───────────────────────────────────────────────
  findUserByEmail(email) {
    const db = read();
    return db.users.find(u => u.email === email) || null;
  }
  findUserById(id) {
    const db = read();
    return db.users.find(u => u.id === id) || null;
  }
  createUser(user) {
    const db = read();
    db.users.push(user);
    write(db);
    return user;
  }
  getAllUsers() {
    return read().users;
  }

  // ─── POSTS ───────────────────────────────────────────────
  getAllPosts() {
    return read().posts;
  }
  getPostById(id) {
    const db = read();
    return db.posts.find(p => p.id === id) || null;
  }
  createPost(post) {
    const db = read();
    db.posts.push(post);
    write(db);
    return post;
  }
  updatePost(id, updates) {
    const db = read();
    const idx = db.posts.findIndex(p => p.id === id);
    if (idx === -1) return null;
    db.posts[idx] = { ...db.posts[idx], ...updates, updatedAt: new Date().toISOString() };
    write(db);
    return db.posts[idx];
  }
  deletePost(id) {
    const db = read();
    const idx = db.posts.findIndex(p => p.id === id);
    if (idx === -1) return false;
    db.posts.splice(idx, 1);
    write(db);
    return true;
  }

  // ─── PLUGINS ─────────────────────────────────────────────
  getAllPlugins() {
    return read().plugins;
  }
  getPluginById(id) {
    const db = read();
    return db.plugins.find(p => p.id === id) || null;
  }
  savePlugin(plugin) {
    const db = read();
    const idx = db.plugins.findIndex(p => p.id === plugin.id);
    if (idx === -1) db.plugins.push(plugin);
    else db.plugins[idx] = plugin;
    write(db);
    return plugin;
  }
  togglePlugin(id, enabled) {
    const db = read();
    const idx = db.plugins.findIndex(p => p.id === id);
    if (idx === -1) return null;
    db.plugins[idx].enabled = enabled;
    write(db);
    return db.plugins[idx];
  }

  // ─── SESSIONS ────────────────────────────────────────────
  setSession(token, data) {
    const db = read();
    db.sessions[token] = { ...data, expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
    write(db);
  }
  getSession(token) {
    const db = read();
    const session = db.sessions[token];
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      delete db.sessions[token];
      write(db);
      return null;
    }
    return session;
  }
  deleteSession(token) {
    const db = read();
    delete db.sessions[token];
    write(db);
  }
}

module.exports = new Database();
