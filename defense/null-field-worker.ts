export default {
  /**
   * The Null Field Worker
   * ---------------------
   * This organ erases malformed, hostile, or meaningless events by collapsing
   * them into zero-state artifacts. It prevents entropy spikes, nullifies
   * malformed probes, and routes pressure through vacuum channels to maintain
   * defensive stability.
   */

  handle(event) {
    // Detect malformed or hostile patterns
    if (this.isMalformed(event) || this.isHostile(event)) {
      return this.collapseToZeroState(event);
    }

    // Default: pass through untouched
    return event;
  },

  isMalformed(event) {
    return (
      event == null ||
      typeof event !== "object" ||
      !event.type ||
      event.type === "undefined" ||
      event.payload === undefined
    );
  },

  isHostile(event) {
    return (
      event.type === "probe" ||
      event.type === "entropy-spike" ||
      event.type === "hostile" ||
      (event.metadata && event.metadata.anomaly === true)
    );
  },

  collapseToZeroState(event) {
    return {
      type: "zero-state",
      timestamp: Date.now(),
      origin: event?.origin || "unknown",
      vacuumChannel: true,
      erased: true,
    };
  },
};
