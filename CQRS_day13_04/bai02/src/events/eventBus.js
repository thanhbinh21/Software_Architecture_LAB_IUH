/**
 * EventBus – simple in-process pub/sub event bus.
 * Commands emit events, and subscribers (handlers) react to them.
 */
class EventBus {
  constructor() {
    /** @type {Map<string, Function[]>} */
    this.handlers = new Map();

    /** @type {Array<{type: string, payload: object, timestamp: string}>} */
    this.eventLog = [];
  }

  /**
   * Subscribe a handler to an event type.
   * @param {string} eventType
   * @param {Function} handler
   */
  on(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType).push(handler);
  }

  /**
   * Publish an event – stores it in the log and notifies all subscribers.
   * @param {string} eventType
   * @param {object} payload
   */
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

  /**
   * Get the full event log (useful for debugging / UI).
   */
  getLog() {
    return [...this.eventLog];
  }

  /**
   * Clear the event log.
   */
  clearLog() {
    this.eventLog = [];
  }
}

module.exports = { EventBus };
