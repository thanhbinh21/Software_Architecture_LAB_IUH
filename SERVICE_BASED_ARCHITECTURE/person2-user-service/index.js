const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key-change-in-production';

// ========================
// CONFIG: Đổi IP ở đây
// ========================
const CONFIG = {
  USER_SERVICE_PORT: 3001,
};

app.use(cors());
app.use(express.json());

// Init SQLite DB
const db = new Database('./users.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'USER',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed admin
const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@company.com');
if (!adminExists) {
  const hashed = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Admin', 'admin@company.com', hashed, 'ADMIN');
  console.log('✅ Admin seeded: admin@company.com / admin123');
}

// ============ ROUTES ============

// POST /register
app.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const hashed = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email, hashed, role || 'USER');
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

// GET /users (ADMIN only)
app.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users').all();
  res.json(users);
});

// GET /users/:id - Verify user exists (used by Order Service)
app.get('/users/:id', (req, res) => {
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'user-service', port: PORT }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 User Service running on port ${PORT}`);
  console.log(`   URL: http://0.0.0.0:${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   POST http://localhost:${PORT}/register`);
  console.log(`   POST http://localhost:${PORT}/login`);
  console.log(`   GET  http://localhost:${PORT}/users`);
  console.log(`   GET  http://localhost:${PORT}/users/:id`);
  console.log(`   GET  http://localhost:${PORT}/health\n`);
});
