const express = require('express');
const axios = require('axios');

const { retryPolicy, circuitBreakerPolicy, bulkheadPolicy } = require('./resilience');
const limiter = require('./rateLimiter');

const app = express();
const callServiceB = () => axios.get('http://localhost:3001/random');

// RETRY
app.get('/retry', async (req, res) => {
  try {
    const result = await retryPolicy.execute(callServiceB);
    res.json(result.data);
  } catch {
    res.status(500).json({ msg: 'Retry failed' });
  }
});

// CIRCUIT BREAKER
app.get('/cb', async (req, res) => {
  try {
    const result = await circuitBreakerPolicy.execute(callServiceB);
    res.json(result.data);
  } catch {
    res.json({ fallback: 'CB fallback response' });
  }
});

// BULKHEAD
app.get('/bulkhead', async (req, res) => {
  try {
    const result = await bulkheadPolicy.execute(callServiceB);
    res.json(result.data);
  } catch {
    res.status(429).json({ msg: 'Bulkhead full' });
  }
});

// RATE LIMITER
app.get('/rate-limit', async (req, res) => {
  try {
    const result = await limiter.schedule(callServiceB);
    res.json(result.data);
  } catch {
    res.status(429).json({ msg: 'Rate limited' });
  }
});

// COMBINED
app.get('/combined', async (req, res) => {
  try {
    const result = await limiter.schedule(() =>
      bulkheadPolicy.execute(() =>
        circuitBreakerPolicy.execute(() =>
          retryPolicy.execute(callServiceB)
        )
      )
    );
    res.json(result.data);
  } catch {
    res.json({ fallback: 'Combined fallback' });
  }
});

app.listen(3000, () => console.log('Service A :3000'));
