const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3002;

// ========================
// CONFIG: Đổi IP ở đây
// ========================
const CONFIG = {
  FOOD_SERVICE_PORT: 3002,
};

app.use(cors());
app.use(express.json());

// Init SQLite
const db = new Database('./foods.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT DEFAULT 'main',
    image_url TEXT,
    available INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed data
const count = db.prepare('SELECT COUNT(*) as c FROM foods').get();
if (count.c === 0) {
  const seed = db.prepare('INSERT INTO foods (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)');
  const foods = [
    ['Cơm Sườn Nướng', 'Cơm trắng + sườn heo nướng mật ong, dưa leo, cà chua', 45000, 'main', 'https://via.placeholder.com/150'],
    ['Phở Bò Đặc Biệt', 'Phở tái, chín, gầu, gân với nước dùng xương bò', 55000, 'noodle', 'https://via.placeholder.com/150'],
    ['Bún Bò Huế', 'Bún bò Huế cay thơm đặc trưng miền Trung', 50000, 'noodle', 'https://via.placeholder.com/150'],
    ['Bánh Mì Thịt', 'Bánh mì giòn + thịt nguội + pate + rau sống', 25000, 'snack', 'https://via.placeholder.com/150'],
    ['Cơm Gà Xối Mỡ', 'Cơm trắng + gà xối mỡ giòn da, nước mắm gừng', 50000, 'main', 'https://via.placeholder.com/150'],
    ['Bún Thịt Nướng', 'Bún + thịt heo nướng + chả giò + rau sống', 45000, 'noodle', 'https://via.placeholder.com/150'],
    ['Trà Sữa Trân Châu', 'Trà sữa thơm ngon với trân châu đường đen', 35000, 'drink', 'https://via.placeholder.com/150'],
    ['Nước Cam Tươi', 'Cam vắt tươi 100% không đường', 20000, 'drink', 'https://via.placeholder.com/150'],
  ];
  foods.forEach(f => seed.run(...f));
  console.log('✅ Seeded 8 food items');
}

// ============ ROUTES ============

// GET /foods
app.get('/foods', (req, res) => {
  const { category, available } = req.query;
  let query = 'SELECT * FROM foods WHERE 1=1';
  const params = [];
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (available !== undefined) { query += ' AND available = ?'; params.push(available === 'true' ? 1 : 0); }
  query += ' ORDER BY created_at DESC';
  const foods = db.prepare(query).all(...params);
  res.json(foods);
});

// GET /foods/:id
app.get('/foods/:id', (req, res) => {
  const food = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
  if (!food) return res.status(404).json({ error: 'Food not found' });
  res.json(food);
});

// POST /foods
app.post('/foods', (req, res) => {
  const { name, description, price, category, image_url } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });
  const result = db.prepare('INSERT INTO foods (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)').run(name, description || '', price, category || 'main', image_url || '');
  const food = db.prepare('SELECT * FROM foods WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Food created', food });
});

// PUT /foods/:id
app.put('/foods/:id', (req, res) => {
  const { name, description, price, category, image_url, available } = req.body;
  const food = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
  if (!food) return res.status(404).json({ error: 'Food not found' });
  db.prepare(`
    UPDATE foods SET 
      name = ?, description = ?, price = ?, category = ?, image_url = ?, available = ?
    WHERE id = ?
  `).run(
    name ?? food.name,
    description ?? food.description,
    price ?? food.price,
    category ?? food.category,
    image_url ?? food.image_url,
    available !== undefined ? (available ? 1 : 0) : food.available,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
  res.json({ message: 'Food updated', food: updated });
});

// DELETE /foods/:id
app.delete('/foods/:id', (req, res) => {
  const food = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
  if (!food) return res.status(404).json({ error: 'Food not found' });
  db.prepare('DELETE FROM foods WHERE id = ?').run(req.params.id);
  res.json({ message: 'Food deleted' });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'food-service', port: PORT }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🍜 Food Service running on port ${PORT}`);
  console.log(`   URL: http://0.0.0.0:${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET    http://localhost:${PORT}/foods`);
  console.log(`   GET    http://localhost:${PORT}/foods/:id`);
  console.log(`   POST   http://localhost:${PORT}/foods`);
  console.log(`   PUT    http://localhost:${PORT}/foods/:id`);
  console.log(`   DELETE http://localhost:${PORT}/foods/:id`);
  console.log(`   GET    http://localhost:${PORT}/health\n`);
});
