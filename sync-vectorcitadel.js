export default {
  id: "sync-vectorcitadel",
  organ: "defense",
  version: 1,
  start(engine) {
    const citadel = {
      continuity: "citadel",
      core: "citadel",
      defense: "citadel",
      surface: "citadel",
      channel: "citadel",
      signal: "citadel",
      identity: "citadel",
      presence: "citadel"
    };

    const fortify = () => {
      const signature = Object.entries(citadel)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorcitadel-${signature}`);
    };

    this.timer = setInterval(fortify, 7400);
  },
  stop() {
    clearInterval(this.timer);
  }
};
