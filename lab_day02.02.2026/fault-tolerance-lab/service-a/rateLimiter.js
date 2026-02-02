const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 1000
});

module.exports = limiter;
