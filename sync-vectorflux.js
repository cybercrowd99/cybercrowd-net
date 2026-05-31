export default {
  id: "sync-vectorflux",
  organ: "defense",
  version: 1,
  start(engine) {
    const flux = {
      continuity: 0.03,
      core: 0.00,
      defense: 0.07,
      surface: 0.12,
      channel: 0.05,
      signal: 0.09,
      identity: 0.02,
      presence: 0.11
    };

    const damp = () => {
      const signature = Object.entries(flux)
        .map(([k, v]) => `${k}:${v.toFixed(2)}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorflux-${signature}`);
    };

    this.timer = setInterval(damp, 5800);
  },
  stop() {
    clearInterval(this.timer);
  }
};
