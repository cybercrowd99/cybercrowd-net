export default {
  id: "sync-vectorwall",
  organ: "defense",
  version: 1,
  start(engine) {
    const wall = {
      continuity: "fortified",
      core: "fortified",
      defense: "fortified",
      surface: "fortified",
      channel: "fortified",
      signal: "fortified",
      identity: "fortified",
      presence: "fortified"
    };

    const reinforce = () => {
      const signature = Object.entries(wall)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorwall-${signature}`);
    };

    this.timer = setInterval(reinforce, 6800);
  },
  stop() {
    clearInterval(this.timer);
  }
};
