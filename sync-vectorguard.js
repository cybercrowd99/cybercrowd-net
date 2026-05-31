export default {
  id: "sync-vectorguard",
  organ: "defense",
  version: 1,
  start(engine) {
    const guard = {
      continuity: "protected",
      core: "protected",
      defense: "protected",
      surface: "protected",
      channel: "protected",
      signal: "protected",
      identity: "protected",
      presence: "protected"
    };

    const shield = () => {
      const signature = Object.entries(guard)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorguard-${signature}`);
    };

    this.timer = setInterval(shield, 6400);
  },
  stop() {
    clearInterval(this.timer);
  }
};
