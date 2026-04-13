require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = Number(process.env.USER_SERVICE_PORT) || 8081;

// Redis publisher
const publisher = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379
});

// In-memory DB (demo)
const users = [];

const JWT_SECRET = process.env.JWT_SECRET || 'movie_ticket_secret_2024';

// POST /register
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Publish event: USER_REGISTERED
    const event = {
      event: 'USER_REGISTERED',
      data: {
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
        timestamp: new Date().toISOString()
      }
    };

    await publisher.publish('movie-ticket-events', JSON.stringify(event));
    console.log(`[USER-SERVICE] Event published: USER_REGISTERED for ${email}`);

    res.status(201).json({
      message: 'User registered successfully',
      userId: newUser.id,
      username: newUser.username
    });
  } catch (err) {
    console.error('[USER-SERVICE] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`[USER-SERVICE] User logged in: ${email}`);
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error('[USER-SERVICE] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users (debug)
app.get('/users', (req, res) => {
  res.json(users.map(u => ({ id: u.id, username: u.username, email: u.email })));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'user-service', port: PORT });
});

app.listen(PORT, () => {
  console.log(`[USER-SERVICE] Running on port ${PORT}`);
  console.log(`[USER-SERVICE] Redis connected for publishing events`);
});
