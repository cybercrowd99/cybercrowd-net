export default {
  id: "sync-colosseum-threshingfloor",
  organ: "foundation",
  version: 1,

  start(engine) {
    const threshingfloor = {
      continuity: "colosseum-foundation",
      core: "colosseum-foundation",
      defense: "colosseum-foundation",
      surface: "colosseum-foundation",
      channel: "colosseum-foundation",
      signal: "colosseum-foundation",
      identity: "colosseum-foundation",
      presence: "colosseum-foundation"
    };

    const stabilize = () => {
      const signature = Object.entries(threshingfloor)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`colosseum-threshingfloor-${signature}`);
    };

    this.timer = setInterval(stabilize, 12000);
  },

  stop() {
    clearInterval(this.timer);
  }
};
