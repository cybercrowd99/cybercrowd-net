export default {
  /**
   * Ballistic Dummy Organ
   * ---------------------
   * A conceptual defensive organ that simulates believable system
   * responses to hostile probes without interfering with the real
   * ballistic ingestion worker already in the repository.
   */

  handle(event) {
    if (this.isHighVelocity(event)) {
      return this.simulate(event);
    }
    return event;
  },

  isHighVelocity(event) {
    return (
      event &&
      event.metadata &&
      typeof event.metadata.velocity === "number" &&
      event.metadata.velocity > 0.85
    );
  },

  simulate(event) {
    return {
      type: "simulated-decoy",
      timestamp: Date.now(),
      origin: event?.origin || "unknown",
      simulated: true,
      echo: event?.payload || null,
      checksum: Math.random().toString(36).slice(2),
    };
  },
};
