export default {
  id: "sync-apex",
  organ: "defense",
  version: 1,

  start(engine) {
    const apex = {
      continuity: "apex-unified",
      core: "apex-unified",
      defense: "apex-unified",
      surface: "apex-unified",
      channel: "apex-unified",
      signal: "apex-unified",
      identity: "apex-unified",
      presence: "apex-unified"
    };

    const unify = () => {
      const signature = Object.entries(apex)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`apex-${signature}`);
    };

    this.timer = setInterval(unify, 13000);
  },

  stop() {
    clearInterval(this.timer);
  }
};
