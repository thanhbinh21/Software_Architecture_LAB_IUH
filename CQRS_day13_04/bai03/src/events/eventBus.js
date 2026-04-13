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
      try {
        fn(event);
      } catch (err) {
        console.error(`[EventBus] handler error for "${eventType}":`, err);
      }
    }
    return event;
  }

  getLog() {
    return [...this.eventLog];
  }
}

module.exports = { EventBus };
