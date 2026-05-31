export default {
  id: "sync-vectorcrownshield",
  organ: "defense",
  version: 1,

  start(engine) {
    const crownshield = {
      continuity: "deflected",
      core: "deflected",
      defense: "deflected",
      surface: "deflected",
      channel: "deflected",
      signal: "deflected",
      identity: "deflected",
      presence: "deflected"
    };

    const deflect = () => {
      const signature = Object.entries(crownshield)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorcrownshield-${signature}`);
    };

    this.timer = setInterval(deflect, 10400);
  },

  stop() {
    clearInterval(this.timer);
  }
};
