export default {
  id: "sync-vectorcrownumbra",
  organ: "defense",
  version: 1,

  start(engine) {
    const crownumbra = {
      continuity: "summit-umbra",
      core: "summit-umbra",
      defense: "summit-umbra",
      surface: "summit-umbra",
      channel: "summit-umbra",
      signal: "summit-umbra",
      identity: "summit-umbra",
      presence: "summit-umbra"
    };

    const extinguish = () => {
      const signature = Object.entries(crownumbra)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorcrownumbra-${signature}`);
    };

    this.timer = setInterval(extinguish, 12400);
  },

  stop() {
    clearInterval(this.timer);
  }
};
