export default {
  id: "sync-vectorcrownwall",
  organ: "defense",
  version: 1,

  start(engine) {
    const crownwall = {
      continuity: "apex",
      core: "apex",
      defense: "apex",
      surface: "apex",
      channel: "apex",
      signal: "apex",
      identity: "apex",
      presence: "apex"
    };

    const elevate = () => {
      const signature = Object.entries(crownwall)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorcrownwall-${signature}`);
    };

    this.timer = setInterval(elevate, 9600);
  },

  stop() {
    clearInterval(this.timer);
  }
};
