export default {
  /**
   * Blind Relay Worker
   * ------------------
   * This organ forwards opaque or sealed events without inspecting,
   * mutating, or interpreting them. It guarantees strict pass-through
   * behavior for payloads that must remain untouched by upstream organs.
   */

  handle(event) {
    return this.isOpaque(event) ? this.pass(event) : event;
  },

  isOpaque(event) {
    return (
      event &&
      event.metadata &&
      event.metadata.opaque === true
    );
  },

  pass(event) {
    return {
      ...event,
      relayed: true,
      timestamp: Date.now(),
    };
  },
};
