export default {
  id: "sync-vectorcrownbarrier",
  organ: "defense",
  version: 1,

  start(engine) {
    const crownbarrier = {
      continuity: "sealed",
      core: "sealed",
      defense: "sealed",
      surface: "sealed",
      channel: "sealed",
      signal: "sealed",
      identity: "sealed",
      presence: "sealed"
    };

    const obstruct = () => {
      const signature = Object.entries(crownbarrier)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorcrownbarrier-${signature}`);
    };

    this.timer = setInterval(obstruct, 10200);
  },

  stop() {
    clearInterval(this.timer);
  }
};
