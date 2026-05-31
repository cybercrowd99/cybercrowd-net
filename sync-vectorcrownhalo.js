export default {
  id: "sync-vectorcrownhalo",
  organ: "defense",
  version: 1,

  start(engine) {
    const crownhalo = {
      continuity: "summit-radiant",
      core: "summit-radiant",
      defense: "summit-radiant",
      surface: "summit-radiant",
      channel: "summit-radiant",
      signal: "summit-radiant",
      identity: "summit-radiant",
      presence: "summit-radiant"
    };

    const diffuse = () => {
      const signature = Object.entries(crownhalo)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorcrownhalo-${signature}`);
    };

    this.timer = setInterval(diffuse, 11400);
  },

  stop() {
    clearInterval(this.timer);
  }
};
