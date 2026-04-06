const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3003;

const CONFIG = {
  USER_SERVICE: 'http://172.16.33.148:3001',
  FOOD_SERVICE: 'http://172.16.33.164:3002',
};

app.use(cors());
app.use(express.json());

const db = new Database('./orders.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_name TEXT,
    user_email TEXT,
    items TEXT NOT NULL,
    total_price REAL NOT NULL,
    status TEXT DEFAULT 'PENDING',
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function verifyUser(userId, authorization) {
  const headers = {};
  if (authorization) headers.Authorization = authorization;
  const res = await axios.get(`${CONFIG.USER_SERVICE}/users/${userId}`, {
    headers,
    timeout: 15000,
    validateStatus: () => true,
  });
  if (res.status >= 200 && res.status < 300) return res.data;
  const err = new Error(`User service HTTP ${res.status}`);
  err.response = res;
  throw err;
}

async function getFoodInfo(foodId) {
  const res = await axios.get(`${CONFIG.FOOD_SERVICE}/foods/${foodId}`, {
    timeout: 15000,
    validateStatus: () => true,
  });
  if (res.status >= 200 && res.status < 300) return res.data;
  const err = new Error(`Food service HTTP ${res.status}`);
  err.response = res;
  throw err;
}

app.post('/orders', async (req, res) => {
  const { user_id, items, note } = req.body;
  const authorization = req.get('Authorization');

  if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'user_id and items[] are required' });
  }

  const uid = Number(user_id);
  if (!Number.isFinite(uid)) {
    return res.status(400).json({ error: 'user_id must be a number' });
  }

  try {
    let user;
    try {
      user = await verifyUser(uid, authorization);
    } catch (e) {
      const st = e.response?.status;
      const body = e.response?.data;
      console.error('verifyUser failed', { user_id: uid, upstreamStatus: st, body, msg: e.message });
      if (st === 404) {
        return res.status(404).json({ error: `User ID ${uid} not found` });
      }
      return res.status(502).json({
        error: 'Cannot reach User service or verify user',
        detail: e.code || e.message,
        upstreamStatus: st,
        upstreamError: typeof body === 'object' ? body?.error || body : body,
      });
    }

    const enrichedItems = [];
    let totalPrice = 0;

    for (const item of items) {
      if (!item.food_id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ error: `Invalid item: ${JSON.stringify(item)}` });
      }
      let food;
      try {
        food = await getFoodInfo(item.food_id);
      } catch (e) {
        const st = e.response?.status;
        if (st === 404) {
return res.status(404).json({ error: `Food ID ${item.food_id} not found` });
        }
        return res.status(502).json({
          error: 'Cannot reach Food service',
          detail: e.message,
          upstreamStatus: st,
        });
      }
      if (!food.available) {
        return res.status(400).json({ error: `Food "${food.name}" is not available` });
      }
      const subtotal = food.price * item.quantity;
      totalPrice += subtotal;
      enrichedItems.push({
        food_id: food.id,
        food_name: food.name,
        food_price: food.price,
        quantity: item.quantity,
        subtotal,
      });
    }

    const result = db
      .prepare(
        `INSERT INTO orders (user_id, user_name, user_email, items, total_price, note, status)
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`
      )
      .run(user.id, user.name, user.email, JSON.stringify(enrichedItems), totalPrice, note || '');

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    const parsedOrder = { ...order, items: JSON.parse(order.items) };

    console.log(`📦 New order #${order.id} from ${user.name} - Total: ${totalPrice.toLocaleString()}đ`);
    res.status(201).json({ message: 'Order created successfully', order: parsedOrder });
  } catch (err) {
    console.error('Order error:', err.message);
    res.status(500).json({ error: 'Failed to create order', detail: err.message });
  }
});

app.get('/orders', (req, res) => {
  const { user_id, status } = req.query;
  let query = 'SELECT * FROM orders WHERE 1=1';
  const params = [];
  if (user_id != null && user_id !== '') {
    query += ' AND user_id = ?';
    params.push(Number(user_id));
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';
  const orders = db
    .prepare(query)
    .all(...params)
    .map((o) => ({ ...o, items: JSON.parse(o.items) }));
  res.json(orders);
});

app.get('/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ ...order, items: JSON.parse(order.items) });
});

app.patch('/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['PENDING', 'CONFIRMED', 'PAID', 'DELIVERING', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Valid: ${validStatuses.join(', ')}` });
  }
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  console.log(`📝 Order #${req.params.id} status → ${status}`);
res.json({ message: 'Status updated', order: { ...updated, items: JSON.parse(updated.items) } });
});

app.get('/health', (req, res) =>
  res.json({ status: 'OK', service: 'order-service', port: PORT, config: CONFIG })
);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n📦 Order Service on ${PORT}`);
  console.log(`   User: ${CONFIG.USER_SERVICE}`);
  console.log(`   Food: ${CONFIG.FOOD_SERVICE}\n`);
});
