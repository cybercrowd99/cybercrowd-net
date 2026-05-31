export default {
  id: "sync-vectorcrownveil",
  organ: "defense",
  version: 1,

  start(engine) {
    const crownveil = {
      continuity: "summit-veiled",
      core: "summit-veiled",
      defense: "summit-veiled",
      surface: "summit-veiled",
      channel: "summit-veiled",
      signal: "summit-veiled",
      identity: "summit-veiled",
      presence: "summit-veiled"
    };

    const shroud = () => {
      const signature = Object.entries(crownveil)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorcrownveil-${signature}`);
    };

    this.timer = setInterval(shroud, 11600);
  },

  stop() {
    clearInterval(this.timer);
  }
};
