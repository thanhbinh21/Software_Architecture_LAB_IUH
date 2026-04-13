require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');

const app = express();
app.use(express.json());
app.use(cors());

const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT) || 6379 });
const subscriber = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT) || 6379 });

const INITIAL_BALANCE_VI = Number(process.env.WALLET_INITIAL_BALANCE || 5_000_000);
const STREAM_PREFIX = 'wallet:es:';
const READ_MODEL_PREFIX = 'wallet:rm:';
const DEBITED_BOOKINGS_KEY = 'wallet:debited-booking-ids';
const PORT = Number(process.env.WALLET_SERVICE_PORT) || Number(process.env.PORT) || 8085;

function streamKey(userId) {
  return `${STREAM_PREFIX}${userId}`;
}

function readModelKey(userId) {
  return `${READ_MODEL_PREFIX}${userId}`;
}

async function getReadBalance(userId) {
  const b = await redis.hget(readModelKey(userId), 'balance');
  return b === null ? null : Number(b);
}

async function appendEvent(userId, type, payload) {
  const ts = new Date().toISOString();
  const entryId = await redis.xadd(
    streamKey(userId),
    '*',
    'type',
    type,
    'payload',
    JSON.stringify(payload),
    'ts',
    ts
  );
  return { entryId, ts };
}

function applyEventToBalance(current, type, payload) {
  switch (type) {
    case 'WALLET_INITIALIZED':
      return (payload.initialBalance != null ? Number(payload.initialBalance) : 0);
    case 'FUNDS_CREDITED':
      return current + Number(payload.amount || 0);
    case 'FUNDS_DEBITED_TICKET':
      return current - Number(payload.amount || 0);
    default:
      return current;
  }
}

async function rebuildBalanceFromStream(userId) {
  const rows = await redis.xrange(streamKey(userId), '-', '+');
  let balance = 0;
  let initialized = false;
  for (const [, fields] of rows) {
    const map = fieldsToObject(fields);
    const type = map.type;
    const payload = safeJson(map.payload);
    if (type === 'WALLET_INITIALIZED') initialized = true;
    balance = applyEventToBalance(balance, type, payload);
  }
  return { balance, initialized, eventCount: rows.length };
}

function fieldsToObject(fields) {
  const o = {};
  for (let i = 0; i < fields.length; i += 2) o[fields[i]] = fields[i + 1];
  return o;
}

function safeJson(s) {
  try {
    return JSON.parse(s || '{}');
  } catch {
    return {};
  }
}

async function ensureReadModel(userId, balance, versionInc) {
  const key = readModelKey(userId);
  const v = await redis.hincrby(key, 'version', versionInc);
  await redis.hset(key, 'balance', String(balance), 'userId', userId, 'updatedAt', new Date().toISOString());
  return v;
}

// --- CQRS: command side (writes) ---
const commandRouter = express.Router();

commandRouter.post('/wallet/initialize', async (req, res) => {
  try {
    const { userId, initialBalance } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const exists = await redis.exists(readModelKey(userId));
    if (exists) {
      const balance = await getReadBalance(userId);
      return res.status(200).json({ success: true, idempotent: true, balance });
    }

    const amount = initialBalance != null ? Number(initialBalance) : INITIAL_BALANCE_VI;
    const { entryId, ts } = await appendEvent(userId, 'WALLET_INITIALIZED', {
      initialBalance: amount,
      source: 'COMMAND'
    });
    await redis.hset(readModelKey(userId), {
      balance: String(amount),
      version: '1',
      userId,
      updatedAt: ts
    });

    res.status(201).json({ success: true, balance: amount, streamEntryId: entryId });
  } catch (err) {
    console.error('[WALLET] initialize:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

commandRouter.post('/wallet/credit', async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    if (!userId || amount == null) return res.status(400).json({ error: 'userId and amount required' });

    const n = Number(amount);
    if (n <= 0) return res.status(400).json({ error: 'amount must be positive' });

    let balance = await getReadBalance(userId);
    if (balance === null) {
      return res.status(404).json({ error: 'Wallet not found; user must be registered first' });
    }

    const { entryId } = await appendEvent(userId, 'FUNDS_CREDITED', {
      amount: n,
      reason: reason || 'manual_credit'
    });
    balance += n;
    await ensureReadModel(userId, balance, 1);

    res.json({ success: true, balanceAfter: balance, streamEntryId: entryId });
  } catch (err) {
    console.error('[WALLET] credit:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

commandRouter.post('/wallet/debit-booking', async (req, res) => {
  try {
    const { userId, bookingId, amount, movieId, movieTitle, seats } = req.body;
    if (!userId || !bookingId || amount == null) {
      return res.status(400).json({ error: 'userId, bookingId, amount required' });
    }

    const n = Number(amount);
    if (n <= 0) return res.status(400).json({ error: 'amount must be positive' });

    const already = await redis.sismember(DEBITED_BOOKINGS_KEY, bookingId);
    if (already) {
      const balance = await getReadBalance(userId);
      return res.status(200).json({ success: true, idempotent: true, balanceAfter: balance });
    }

    const balance = await getReadBalance(userId);
    if (balance === null) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    if (balance < n) {
      return res.status(402).json({
        error: 'Insufficient funds',
        balance,
        required: n
      });
    }

    const { entryId } = await appendEvent(userId, 'FUNDS_DEBITED_TICKET', {
      amount: n,
      bookingId,
      movieId: movieId || null,
      movieTitle: movieTitle || null,
      seats: seats != null ? Number(seats) : null
    });

    const newBal = balance - n;
    await ensureReadModel(userId, newBal, 1);
    await redis.sadd(DEBITED_BOOKINGS_KEY, bookingId);

    res.json({
      success: true,
      balanceAfter: newBal,
      streamEntryId: entryId,
      eventType: 'FUNDS_DEBITED_TICKET'
    });
  } catch (err) {
    console.error('[WALLET] debit-booking:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/commands', commandRouter);

// --- CQRS: query side (read model + stream views) ---
const readRouter = express.Router();

readRouter.get('/wallets/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;
    const balance = await getReadBalance(userId);
    if (balance === null) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const recent = await redis.xrevrange(streamKey(userId), '+', '-', 'COUNT', 15);
    const events = recent.map(([id, fields]) => {
      const m = fieldsToObject(fields);
      return {
        id,
        type: m.type,
        payload: safeJson(m.payload),
        ts: m.ts
      };
    });

    res.json({
      success: true,
      userId,
      balance,
      recentEvents: events
    });
  } catch (err) {
    console.error('[WALLET] summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

readRouter.get('/wallets/:userId/events', async (req, res) => {
  try {
    const { userId } = req.params;
    const count = Math.min(Number(req.query.count) || 100, 500);
    const rows = await redis.xrevrange(streamKey(userId), '+', '-', 'COUNT', count);
    const events = rows.map(([id, fields]) => {
      const m = fieldsToObject(fields);
      return { id, type: m.type, payload: safeJson(m.payload), ts: m.ts };
    });
    res.json({ success: true, userId, count: events.length, events });
  } catch (err) {
    console.error('[WALLET] events:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* Replay: fold full event stream to audit projection balance */
readRouter.get('/wallets/:userId/replay-balance', async (req, res) => {
  try {
    const { userId } = req.params;
    const { balance, initialized, eventCount } = await rebuildBalanceFromStream(userId);
    const projected = await getReadBalance(userId);
    res.json({
      success: true,
      userId,
      replayedBalance: initialized ? balance : null,
      projectedBalance: projected,
      consistent: initialized && projected === balance,
      eventCount
    });
  } catch (err) {
    console.error('[WALLET] replay:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/read', readRouter);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'wallet-service',
    port: PORT,
    patterns: { commands: '/commands/*', queries: '/read/*', eventStore: 'Redis Streams wallet:es:{userId}' }
  });
});

// --- Event-driven: create wallet on USER_REGISTERED ---
subscriber.subscribe('movie-ticket-events', (err) => {
  if (err) console.error('[WALLET] subscribe error:', err);
  else console.log('[WALLET-SERVICE] Subscribed to movie-ticket-events (USER_REGISTERED → ví)');
});

subscriber.on('message', async (_channel, message) => {
  try {
    const { event, data } = JSON.parse(message);
    if (event !== 'USER_REGISTERED' || !data?.userId) return;

    const exists = await redis.exists(readModelKey(data.userId));
    if (exists) {
      console.log(`[WALLET] Skip init — wallet already exists for ${data.userId}`);
      return;
    }

    const { entryId } = await appendEvent(data.userId, 'WALLET_INITIALIZED', {
      initialBalance: INITIAL_BALANCE_VI,
      source: 'USER_REGISTERED',
      email: data.email
    });
    const ts = new Date().toISOString();
    await redis.hset(readModelKey(data.userId), {
      balance: String(INITIAL_BALANCE_VI),
      version: '1',
      userId: data.userId,
      updatedAt: ts
    });
    console.log(`[WALLET] WALLET_INITIALIZED ${data.userId} +${INITIAL_BALANCE_VI} VND (stream ${entryId})`);
  } catch (e) {
    console.error('[WALLET] USER_REGISTERED handler:', e);
  }
});

app.listen(PORT, () => {
  console.log(`[WALLET-SERVICE] CQRS + Event Sourcing on port ${PORT}`);
  console.log(`[WALLET-SERVICE] Commands: POST /commands/wallet/* — Queries: GET /read/wallets/:userId/*`);
});
