export default {
  id: "sync-vectorrampart",
  organ: "defense",
  version: 1,

  start(engine) {
    const rampart = {
      continuity: "elevated",
      core: "elevated",
      defense: "elevated",
      surface: "elevated",
      channel: "elevated",
      signal: "elevated",
      identity: "elevated",
      presence: "elevated"
    };

    const fortify = () => {
      const signature = Object.entries(rampart)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorrampart-${signature}`);
    };

    this.timer = setInterval(fortify, 8800);
  },

  stop() {
    clearInterval(this.timer);
  }
};
