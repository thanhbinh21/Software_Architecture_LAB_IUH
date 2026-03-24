const express = require('express');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Docker!', stage: 'multi-stage build' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});