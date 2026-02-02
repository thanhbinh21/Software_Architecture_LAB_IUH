const express = require('express');
const app = express();

app.get('/users/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: 'Alice',
    email: 'alice@example.com'
  });
});

app.listen(3001, () => console.log('REST running on 3001'));
