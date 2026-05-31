export default {
  id: "sync-vectorlock",
  organ: "defense",
  version: 1,
  start(engine) {
    const lock = {
      continuity: true,
      core: true,
      defense: true,
      surface: true,
      channel: true,
      signal: true,
      identity: true,
      presence: true
    };

    const enforce = () => {
      const signature = Object.entries(lock)
        .map(([k, v]) => `${k}:${v ? "locked" : "unlocked"}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorlock-${signature}`);
    };

    this.timer = setInterval(enforce, 6000);
  },
  stop() {
    clearInterval(this.timer);
  }
};
