require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const Redis = require('ioredis');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = Number(process.env.PAYMENT_NOTIFICATION_SERVICE_PORT) || 8084;

// Redis connections
const redisOpts = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379
};
const publisher = new Redis(redisOpts);
const subscriber = new Redis(redisOpts);

// In-memory logs for viewing in UI
const paymentLogs = [];
const notificationLogs = [];

// ============================================================
// PAYMENT SERVICE LOGIC
// ============================================================
async function processPayment(bookingData) {
  console.log(`\n[PAYMENT-SERVICE] Processing payment for booking: ${bookingData.bookingId}`);
  console.log(`[PAYMENT-SERVICE] Amount: ${bookingData.totalPrice.toLocaleString()} VND`);

  // Simulate async payment processing (1-2 seconds)
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  // Random success (80%) or fail (20%)
  const isSuccess = Math.random() < 0.8;

  const paymentLog = {
    bookingId: bookingData.bookingId,
    userId: bookingData.userId,
    username: bookingData.username,
    amount: bookingData.totalPrice,
    status: isSuccess ? 'SUCCESS' : 'FAILED',
    timestamp: new Date().toISOString()
  };
  paymentLogs.push(paymentLog);

  if (isSuccess) {
    const event = {
      event: 'PAYMENT_COMPLETED',
      data: {
        bookingId: bookingData.bookingId,
        userId: bookingData.userId,
        username: bookingData.username,
        movieTitle: bookingData.movieTitle,
        seats: bookingData.seats,
        totalPrice: bookingData.totalPrice,
        transactionId: `TXN-${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    };
    await publisher.publish('movie-ticket-events', JSON.stringify(event));
    console.log(`[PAYMENT-SERVICE] ✅ Payment SUCCESS - Published PAYMENT_COMPLETED for ${bookingData.bookingId}`);
  } else {
    const event = {
      event: 'BOOKING_FAILED',
      data: {
        bookingId: bookingData.bookingId,
        userId: bookingData.userId,
        username: bookingData.username,
        reason: 'Payment declined by bank',
        timestamp: new Date().toISOString()
      }
    };
    await publisher.publish('movie-ticket-events', JSON.stringify(event));
    console.log(`[PAYMENT-SERVICE] ❌ Payment FAILED - Published BOOKING_FAILED for ${bookingData.bookingId}`);
  }
}

// ============================================================
// NOTIFICATION SERVICE LOGIC
// ============================================================
function sendNotification(type, data) {
  let message = '';

  if (type === 'PAYMENT_COMPLETED') {
    message = `🎬 ĐẶT VÉ THÀNH CÔNG!\n` +
              `👤 Khách hàng: ${data.username}\n` +
              `🎟️  Booking: #${data.bookingId}\n` +
              `🎥 Phim: ${data.movieTitle}\n` +
              `💺 Số ghế: ${data.seats}\n` +
              `💰 Tổng tiền: ${data.totalPrice?.toLocaleString()} VND\n` +
              `🕐 Thời gian: ${new Date(data.timestamp).toLocaleString('vi-VN')}`;
  } else if (type === 'BOOKING_FAILED') {
    message = `❌ ĐẶT VÉ THẤT BẠI!\n` +
              `👤 Khách hàng: ${data.username}\n` +
              `🎟️  Booking: #${data.bookingId}\n` +
              `⚠️  Lý do: ${data.reason}\n` +
              `🕐 Thời gian: ${new Date(data.timestamp).toLocaleString('vi-VN')}`;
  } else if (type === 'USER_REGISTERED') {
    message = `🎉 ĐĂNG KÝ THÀNH CÔNG!\n` +
              `👤 Người dùng: ${data.username}\n` +
              `📧 Email: ${data.email}\n` +
              `🕐 Thời gian: ${new Date(data.timestamp).toLocaleString('vi-VN')}`;
  }

  const log = { type, message, data, timestamp: new Date().toISOString() };
  notificationLogs.push(log);

  console.log('\n' + '='.repeat(50));
  console.log('[NOTIFICATION-SERVICE]');
  console.log(message);
  console.log('='.repeat(50) + '\n');

  return log;
}

// ============================================================
// SUBSCRIBE TO EVENTS
// ============================================================
subscriber.subscribe('movie-ticket-events', (err) => {
  if (err) {
    console.error('[PAYMENT/NOTIFICATION-SERVICE] Redis subscribe error:', err);
  } else {
    console.log('[PAYMENT-SERVICE] Subscribed to movie-ticket-events');
    console.log('[NOTIFICATION-SERVICE] Subscribed to movie-ticket-events');
  }
});

subscriber.on('message', async (channel, message) => {
  try {
    const { event, data } = JSON.parse(message);
    console.log(`\n[EVENT RECEIVED] ${event}`);

    switch (event) {
      case 'BOOKING_CREATED':
        // Wallet checkout: booking-service already debited wallet and will publish PAYMENT_COMPLETED
        if (data.paidViaWallet) {
          console.log(`[PAYMENT-SERVICE] Skip card payment — wallet already charged for ${data.bookingId}`);
        } else {
          await processPayment(data);
        }
        break;

      case 'PAYMENT_COMPLETED':
        // Notification service handles this
        sendNotification('PAYMENT_COMPLETED', data);
        break;

      case 'BOOKING_FAILED':
        // Notification service handles this too
        sendNotification('BOOKING_FAILED', data);
        break;

      case 'USER_REGISTERED':
        // Notification service handles welcome
        sendNotification('USER_REGISTERED', data);
        break;

      default:
        console.log(`[EVENT] Unknown event: ${event}`);
    }
  } catch (err) {
    console.error('[PAYMENT/NOTIFICATION-SERVICE] Event processing error:', err);
  }
});

// ============================================================
// REST API for viewing logs
// ============================================================
app.get('/payments', (req, res) => {
  res.json({ success: true, count: paymentLogs.length, payments: paymentLogs });
});

app.get('/notifications', (req, res) => {
  res.json({ success: true, count: notificationLogs.length, notifications: notificationLogs });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    services: ['payment-service', 'notification-service'],
    port: PORT,
    stats: {
      paymentsProcessed: paymentLogs.length,
      notificationsSent: notificationLogs.length
    }
  });
});

app.listen(PORT, () => {
  console.log(`[PAYMENT+NOTIFICATION-SERVICE] Running on port ${PORT}`);
  console.log(`[PAYMENT-SERVICE] Listening for BOOKING_CREATED events`);
  console.log(`[NOTIFICATION-SERVICE] Listening for PAYMENT_COMPLETED and BOOKING_FAILED events`);
});
