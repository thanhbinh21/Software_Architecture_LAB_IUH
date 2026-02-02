const express = require('express');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const CircuitBreaker = require('opossum');
const Bottleneck = require('bottleneck');

const app = express();

// ==================
// RETRY
// ==================
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: () => true
});

// ==================
// SERVICE B CALL
// ==================
const callServiceB = async () => {
  const res = await axios.get('http://localhost:3001/random');
  return res.data;
};

// ==================
// CIRCUIT BREAKER
// ==================
const breaker = new CircuitBreaker(callServiceB, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000
});

breaker.fallback(() => ({ fallback: 'CB fallback' }));

// ==================
// RATE LIMITER + BULKHEAD
// ==================
const limiter = new Bottleneck({
  maxConcurrent: 2, // BULKHEAD
  minTime: 500     // RATE LIMIT
});

// ==================
// APIs
// ==================

// RETRY
app.get('/retry', async (req, res) => {
  try {
    const data = await callServiceB();
    res.json(data);
  } catch {
    res.status(500).json({ msg: 'Retry failed' });
  }
});

// CIRCUIT BREAKER
app.get('/cb', async (req, res) => {
  const result = await breaker.fire();
  res.json(result);
});

// RATE LIMIT
app.get('/rate-limit', async (req, res) => {
  try {
    const result = await limiter.schedule(callServiceB);
    res.json(result);
  } catch {
    res.status(429).json({ msg: 'Rate limited' });
  }
});

// BULKHEAD
app.get('/bulkhead', async (req, res) => {
  try {
    const result = await limiter.schedule(callServiceB);
    res.json(result);
  } catch {
    res.status(429).json({ msg: 'Bulkhead full' });
  }
});

// COMBINED
app.get('/combined', async (req, res) => {
  try {
    const result = await limiter.schedule(() => breaker.fire());
    res.json(result);
  } catch {
    res.json({ fallback: 'Combined fallback' });
  }
});

app.listen(3000, () => console.log('Service A running on :3000'));
