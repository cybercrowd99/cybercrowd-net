export default {
  /**
   * Trojan Dummy Worker
   * -------------------
   * Final organ in the defense organism.
   * Mirrors hostile logic back at the attacker without executing it.
   * Generates synthetic reflections to confuse automated scanners,
   * exploit harvesters, and logic-probing adversaries.
   */

  handle(event) {
    if (!this.isHostile(event)) return event;
    return this.reflect(event);
  },

  isHostile(event) {
    return (
      event &&
      typeof event === "object" &&
      event.type === "hostile-logic" &&
      typeof event.payload === "string"
    );
  },

  reflect(event) {
    const now = Date.now();

    return {
      type: "reflected-hostile-logic",
      timestamp: now,
      origin: event.origin || "unknown",
      mirrored: true,
      synthetic_payload: this.generateSynthetic(event.payload),
      signature: this.fingerprint(event.payload, now)
    };
  },

  generateSynthetic(payload) {
    const reversed = payload.split("").reverse().join("");
    const salted = reversed + Math.random().toString(36).slice(2);
    return salted.slice(0, 128);
  },

  fingerprint(payload, seed) {
    const base = payload + seed.toString();
    let hash = 0;

    for (let i = 0; i < base.length; i++) {
      hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
    }

    return hash.toString(16).padStart(8, "0");
  }
};
