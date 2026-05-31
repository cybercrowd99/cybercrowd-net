export default {
  id: "sync-apextotality",
  organ: "defense",
  version: 1,

  start(engine) {
    const apextotality = {
      continuity: "apex-total",
      core: "apex-total",
      defense: "apex-total",
      surface: "apex-total",
      channel: "apex-total",
      signal: "apex-total",
      identity: "apex-total",
      presence: "apex-total"
    };

    const unify = () => {
      const signature = Object.entries(apextotality)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`apextotality-${signature}`);
    };

    this.timer = setInterval(unify, 14200);
  },

  stop() {
    clearInterval(this.timer);
  }
};
