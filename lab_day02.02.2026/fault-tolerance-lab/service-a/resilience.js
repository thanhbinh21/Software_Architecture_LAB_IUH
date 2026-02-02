const {
  circuitBreaker,
  bulkhead,
  ConsecutiveBreaker
} = require('cockatiel');

// CB: OPEN sau 3 lỗi liên tiếp
const circuitBreakerPolicy = circuitBreaker(
  new ConsecutiveBreaker(3),
  { halfOpenAfter: 10000 }
);

// Bulkhead: tối đa 2 request song song
const bulkheadPolicy = bulkhead(2);

module.exports = {
  circuitBreakerPolicy,
  bulkheadPolicy
};
