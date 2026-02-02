const express = require('express');
const app = express();

app.get('/ok', (req, res) => {
  res.json({ msg: 'OK' });
});

app.get('/error', (req, res) => {
  res.status(500).json({ msg: 'ERROR' });
});

app.get('/delay', async (req, res) => {
  await new Promise(r => setTimeout(r, 5000));
  res.json({ msg: 'DELAY 5s' });
});

app.get('/random', (req, res) => {
  Math.random() < 0.5
    ? res.status(500).json({ msg: 'FAIL' })
    : res.json({ msg: 'SUCCESS' });
});

app.listen(3001, () => console.log('Service B :3001'));
