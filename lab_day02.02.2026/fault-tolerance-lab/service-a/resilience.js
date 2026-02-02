const { retry, circuitBreaker, bulkhead } = require('cockatiel');

// Retry
const retryPolicy = retry(handle =>
  handle
    .handleAll()
    .retry()
    .attempts(3)
);

// Circuit Breaker
const circuitBreakerPolicy = circuitBreaker(handle =>
  handle
    .handleAll()
    .breaker()
    .halfOpenAfter(10000)
    .openAfterFailures(3)
);

// Bulkhead
const bulkheadPolicy = bulkhead(2);

module.exports = {
  retryPolicy,
  circuitBreakerPolicy,
  bulkheadPolicy
};
