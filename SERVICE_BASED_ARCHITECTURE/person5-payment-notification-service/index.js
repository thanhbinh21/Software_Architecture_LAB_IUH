const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Database = require('better-sqlite3');

const app = express();
const PAYMENT_PORT = 3004;
const NOTIFICATION_PORT = 3005;

// ========================
// ⚙️ CONFIG: Đổi IP ở đây
// Thay 'localhost' bằng IP thực của từng máy
// ========================
const CONFIG = {
  ORDER_SERVICE_URL: 'http://172.16.34.216:3003', // 👈 IP máy Person 4
  NOTIFICATION_SERVICE_URL: 'http://172.16.33.143:3004', // chính máy này
};

app.use(cors());
app.use(express.json());

// Init SQLite
const db = new Database('./payments.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    method TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'PENDING',
    transaction_ref TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    user_email TEXT,
    order_id INTEGER,
    read_status INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ============ NOTIFICATION HELPERS ============
function saveNotification(type, title, message, userEmail, orderId) {
  db.prepare('INSERT INTO notifications (type, title, message, user_email, order_id) VALUES (?, ?, ?, ?, ?)')
    .run(type, title, message, userEmail || '', orderId || null);
  
  // Console log (như yêu cầu)
  console.log(`\n🔔 NOTIFICATION [${type}]`);
  console.log(`   📧 To: ${userEmail || 'N/A'}`);
  console.log(`   📌 ${title}`);
  console.log(`   💬 ${message}`);
  console.log(`   ─────────────────────────────`);
}

// ============ PAYMENT ROUTES ============

// POST /payments - Thanh toán
app.post('/payments', async (req, res) => {
  const { order_id, method, amount } = req.body;

  if (!order_id || !method || !amount) {
    return res.status(400).json({ error: 'order_id, method, and amount are required' });
  }

  const validMethods = ['COD', 'BANKING'];
  if (!validMethods.includes(method.toUpperCase())) {
    return res.status(400).json({ error: `Invalid method. Valid: ${validMethods.join(', ')}` });
  }

  try {
    // 1. Lấy thông tin đơn hàng
    let order;
    try {
      const orderRes = await axios.get(`${CONFIG.ORDER_SERVICE_URL}/orders/${order_id}`);
      order = orderRes.data;
    } catch {
      return res.status(404).json({ error: `Order ID ${order_id} not found` });
    }

    if (order.status === 'PAID' || order.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Order is already paid' });
    }
    if (order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot pay a cancelled order' });
    }

    // 2. Simulate payment processing
    const transactionRef = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Lưu payment
    const result = db.prepare(`
      INSERT INTO payments (order_id, method, amount, status, transaction_ref)
      VALUES (?, ?, ?, 'SUCCESS', ?)
    `).run(order_id, method.toUpperCase(), amount, transactionRef);

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid);

    // 3. Cập nhật trạng thái order
    try {
      await axios.patch(`${CONFIG.ORDER_SERVICE_URL}/orders/${order_id}/status`, { status: 'PAID' });
    } catch (err) {
      console.warn('⚠️ Could not update order status:', err.message);
    }

    // 4. Gửi thông báo
    const methodLabel = method === 'COD' ? 'Tiền mặt (COD)' : 'Chuyển khoản';
    saveNotification(
      'PAYMENT_SUCCESS',
      `Thanh toán thành công - Đơn #${order_id}`,
      `Đơn hàng #${order_id} đã được thanh toán thành công qua ${methodLabel}. Tổng tiền: ${amount.toLocaleString()}đ. Mã giao dịch: ${transactionRef}`,
      order.user_email,
      order_id
    );

    // Gọi notification endpoint riêng
    try {
      await axios.post(`${CONFIG.NOTIFICATION_SERVICE_URL}/notifications`, {
        type: 'ORDER_PAID',
        order_id,
        user_email: order.user_email,
        user_name: order.user_name,
        amount,
        method: method.toUpperCase(),
        transaction_ref: transactionRef,
      });
    } catch {
      // Notification service on same process, already saved above
    }

    console.log(`💳 Payment #${payment.id} processed for Order #${order_id} via ${method}`);
    res.status(201).json({
      message: 'Payment successful',
      payment,
      transaction_ref: transactionRef,
    });

  } catch (err) {
    console.error('Payment error:', err.message);
    res.status(500).json({ error: 'Payment failed', detail: err.message });
  }
});

// GET /payments
app.get('/payments', (req, res) => {
  const payments = db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all();
  res.json(payments);
});

// GET /payments/:id
app.get('/payments/:id', (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  res.json(payment);
});

// ============ NOTIFICATION ROUTES ============

// POST /notifications - Nhận thông báo từ service khác
app.post('/notifications', (req, res) => {
  const { type, order_id, user_email, user_name, amount, method, transaction_ref } = req.body;
  
  const messages = {
    ORDER_PAID: `Xin chào ${user_name || 'Bạn'}! Đơn hàng #${order_id} đã được thanh toán ${amount?.toLocaleString()}đ qua ${method}. Ref: ${transaction_ref}`,
    ORDER_CREATED: `Đơn hàng #${order_id} đã được tạo thành công!`,
    ORDER_CANCELLED: `Đơn hàng #${order_id} đã bị hủy.`,
  };

  const message = messages[type] || req.body.message || 'Thông báo mới';
  const title = req.body.title || `Thông báo: ${type}`;
  
  saveNotification(type, title, message, user_email, order_id);
  res.status(201).json({ message: 'Notification sent', type });
});

// GET /notifications
app.get('/notifications', (req, res) => {
  const notifs = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC').all();
  res.json(notifs);
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'payment-notification-service', payment_port: PAYMENT_PORT, config: CONFIG }));

app.listen(PAYMENT_PORT, '0.0.0.0', () => {
  console.log(`\n💳 Payment + Notification Service running on port ${PAYMENT_PORT}`);
  console.log(`\n⚙️  Connected to:`);
  console.log(`   Order Service: ${CONFIG.ORDER_SERVICE_URL}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   POST http://localhost:${PAYMENT_PORT}/payments`);
  console.log(`   GET  http://localhost:${PAYMENT_PORT}/payments`);
  console.log(`   POST http://localhost:${PAYMENT_PORT}/notifications`);
  console.log(`   GET  http://localhost:${PAYMENT_PORT}/notifications`);
  console.log(`   GET  http://localhost:${PAYMENT_PORT}/health\n`);
});
