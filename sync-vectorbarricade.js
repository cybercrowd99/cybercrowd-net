export default {
  id: "sync-vectorbarricade",
  organ: "defense",
  version: 1,
  start(engine) {
    const barricade = {
      continuity: "blocked",
      core: "blocked",
      defense: "blocked",
      surface: "blocked",
      channel: "blocked",
      signal: "blocked",
      identity: "blocked",
      presence: "blocked"
    };

    const obstruct = () => {
      const signature = Object.entries(barricade)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorbarricade-${signature}`);
    };

    this.timer = setInterval(obstruct, 8000);
  },
  stop() {
    clearInterval(this.timer);
  }
};
