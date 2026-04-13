require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const Redis = require('ioredis');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = Number(process.env.BOOKING_SERVICE_PORT) || 8083;

// Redis publisher + subscriber
const redisOpts = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379
};
const publisher = new Redis(redisOpts);
const subscriber = new Redis(redisOpts);

// In-memory bookings DB
const bookings = [];

const MOVIE_SERVICE_URL = process.env.MOVIE_SERVICE_URL || 'http://localhost:8082';
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:8085';

async function ensureWalletAndDebit(userId, bookingPayload) {
  const tryDebit = () =>
    axios.post(`${WALLET_SERVICE_URL}/commands/wallet/debit-booking`, bookingPayload, { validateStatus: () => true });

  let res = await tryDebit();
  if (res.status === 404) {
    await axios.post(`${WALLET_SERVICE_URL}/commands/wallet/initialize`, { userId }, { validateStatus: () => true });
    res = await tryDebit();
  }
  return res;
}

// Subscribe to events to update booking status
subscriber.subscribe('movie-ticket-events', (err) => {
  if (err) {
    console.error('[BOOKING-SERVICE] Redis subscribe error:', err);
  } else {
    console.log('[BOOKING-SERVICE] Subscribed to movie-ticket-events');
  }
});

subscriber.on('message', (channel, message) => {
  try {
    const { event, data } = JSON.parse(message);

    if (event === 'PAYMENT_COMPLETED') {
      const booking = bookings.find(b => b.id === data.bookingId);
      if (booking) {
        booking.status = 'CONFIRMED';
        booking.paidAt = data.timestamp;
        console.log(`[BOOKING-SERVICE] Booking ${data.bookingId} CONFIRMED`);
      }
    }

    if (event === 'BOOKING_FAILED') {
      const booking = bookings.find(b => b.id === data.bookingId);
      if (booking) {
        booking.status = 'FAILED';
        booking.failedAt = data.timestamp;
        booking.failReason = data.reason;
        console.log(`[BOOKING-SERVICE] Booking ${data.bookingId} FAILED - ${data.reason}`);
      }
    }
  } catch (err) {
    console.error('[BOOKING-SERVICE] Event parse error:', err);
  }
});

// POST /bookings
app.post('/bookings', async (req, res) => {
  try {
    const { userId, username, movieId, movieTitle, seats, totalPrice } = req.body;

    if (!userId || !movieId || !seats || seats < 1) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const bookingId = `BK-${Date.now()}`;
    const amount = Number(totalPrice) || 0;

    // Try to reserve seats in movie service
    try {
      await axios.patch(`${MOVIE_SERVICE_URL}/movies/${movieId}/seats`, {
        seatsBooked: seats
      });
    } catch (err) {
      return res.status(400).json({ error: 'Not enough seats or movie not found' });
    }

    let walletRes = { status: 200, data: { balanceAfter: null, streamEntryId: null } };
    if (amount > 0) {
      walletRes = await ensureWalletAndDebit(userId, {
        userId,
        bookingId,
        amount,
        movieId,
        movieTitle: movieTitle || 'Unknown Movie',
        seats
      });

      if (walletRes.status === 402) {
        try {
          await axios.patch(`${MOVIE_SERVICE_URL}/movies/${movieId}/seats/release`, { seatsReleased: seats });
        } catch (e) {
          console.error('[BOOKING-SERVICE] Seat rollback failed:', e.message);
        }
        return res.status(402).json({
          error: 'Insufficient wallet balance',
          balance: walletRes.data?.balance,
          required: walletRes.data?.required ?? amount
        });
      }

      if (walletRes.status >= 400) {
        try {
          await axios.patch(`${MOVIE_SERVICE_URL}/movies/${movieId}/seats/release`, { seatsReleased: seats });
        } catch (e) {
          console.error('[BOOKING-SERVICE] Seat rollback failed:', e.message);
        }
        return res.status(502).json({
          error: walletRes.data?.error || 'Wallet service error',
          detail: 'Could not debit wallet; seats were released'
        });
      }
    }

    const walletTx =
      amount > 0
        ? walletRes.data?.streamEntryId || walletRes.data?.transactionId || 'wallet-stream'
        : 'FREE-0';

    const newBooking = {
      id: bookingId,
      userId,
      username: username || 'Unknown',
      movieId,
      movieTitle: movieTitle || 'Unknown Movie',
      seats,
      totalPrice: amount,
      status: 'PENDING',
      walletDebited: amount > 0,
      balanceAfter: walletRes.data?.balanceAfter,
      createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    console.log(`[BOOKING-SERVICE] Booking created: ${newBooking.id} for user ${username} (wallet debited)`);

    const paidAt = new Date().toISOString();
    const paymentEvent = {
      event: 'PAYMENT_COMPLETED',
      data: {
        bookingId: newBooking.id,
        userId: newBooking.userId,
        username: newBooking.username,
        movieTitle: newBooking.movieTitle,
        seats: newBooking.seats,
        totalPrice: newBooking.totalPrice,
        transactionId: walletTx,
        timestamp: paidAt
      }
    };
    await publisher.publish('movie-ticket-events', JSON.stringify(paymentEvent));
    console.log(`[BOOKING-SERVICE] Event published: PAYMENT_COMPLETED (wallet) - ${newBooking.id}`);

    const bookingEvent = {
      event: 'BOOKING_CREATED',
      data: {
        bookingId: newBooking.id,
        userId: newBooking.userId,
        username: newBooking.username,
        movieId: newBooking.movieId,
        movieTitle: newBooking.movieTitle,
        seats: newBooking.seats,
        totalPrice: newBooking.totalPrice,
        paidViaWallet: true,
        balanceAfter: walletRes.data?.balanceAfter,
        timestamp: paidAt
      }
    };
    await publisher.publish('movie-ticket-events', JSON.stringify(bookingEvent));
    console.log(`[BOOKING-SERVICE] Event published: BOOKING_CREATED - ${newBooking.id}`);

    res.status(201).json({
      success: true,
      message: 'Booking confirmed; paid from wallet',
      booking: newBooking,
      wallet: { balanceAfter: walletRes.data?.balanceAfter, streamEntryId: walletRes.data?.streamEntryId }
    });
  } catch (err) {
    console.error('[BOOKING-SERVICE] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /bookings
app.get('/bookings', (req, res) => {
  const { userId } = req.query;
  if (userId) {
    const userBookings = bookings.filter(b => b.userId === userId);
    return res.json({ success: true, bookings: userBookings });
  }
  res.json({ success: true, count: bookings.length, bookings });
});

// GET /bookings/:id
app.get('/bookings/:id', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json({ success: true, booking });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'booking-service', port: PORT });
});

app.listen(PORT, () => {
  console.log(`[BOOKING-SERVICE] Running on port ${PORT}`);
  console.log(`[BOOKING-SERVICE] Wallet + events: debit wallet, publish PAYMENT_COMPLETED + BOOKING_CREATED; listens for PAYMENT_COMPLETED/BOOKING_FAILED`);
});
