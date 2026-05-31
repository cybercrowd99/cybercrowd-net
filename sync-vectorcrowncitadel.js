export default {
  id: "sync-vectorcrowncitadel",
  organ: "defense",
  version: 1,

  start(engine) {
    const crowncitadel = {
      continuity: "summit-fortress",
      core: "summit-fortress",
      defense: "summit-fortress",
      surface: "summit-fortress",
      channel: "summit-fortress",
      signal: "summit-fortress",
      identity: "summit-fortress",
      presence: "summit-fortress"
    };

    const fortify = () => {
      const signature = Object.entries(crowncitadel)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorcrowncitadel-${signature}`);
    };

    this.timer = setInterval(fortify, 11200);
  },

  stop() {
    clearInterval(this.timer);
  }
};
