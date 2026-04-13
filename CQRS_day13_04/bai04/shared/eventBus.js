/**
 * In-memory EventBus simulating Kafka/RabbitMQ.
 * Shared between the Command Service and Query Service in this mock.
 */
class EventBus {
  constructor() {
    this.handlers = new Map();
    this.eventLog = [];
  }

  on(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType).push(handler);
  }

  emit(eventType, payload) {
    const event = {
      type: eventType,
      payload,
      timestamp: new Date().toISOString()
    };
    this.eventLog.push(event);

    const subs = this.handlers.get(eventType) || [];
    for (const fn of subs) {
      // Simulate asynchronous network delivery typical of MQ
      setImmediate(() => {
        try {
          fn(event);
        } catch (err) {
          console.error(`[Message Broker] Consumer error for "${eventType}":`, err);
        }
      });
    }
    return event;
  }

  getLog() {
    return [...this.eventLog];
  }
}

const EventTypes = {
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_CANCELLED: "ORDER_CANCELLED"
};

module.exports = { EventBus, EventTypes };
