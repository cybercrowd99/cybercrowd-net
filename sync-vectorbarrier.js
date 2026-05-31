export default {
  id: "sync-vectorbarrier",
  organ: "defense",
  version: 1,
  start(engine) {
    const barrier = {
      continuity: "isolated",
      core: "isolated",
      defense: "isolated",
      surface: "isolated",
      channel: "isolated",
      signal: "isolated",
      identity: "isolated",
      presence: "isolated"
    };

    const enforce = () => {
      const signature = Object.entries(barrier)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorbarrier-${signature}`);
    };

    this.timer = setInterval(enforce, 6600);
  },
  stop() {
    clearInterval(this.timer);
  }
};
