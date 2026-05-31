export default {
  id: "sync-vectorbattlement",
  organ: "defense",
  version: 1,

  start(engine) {
    const battlement = {
      continuity: "crenellated",
      core: "crenellated",
      defense: "crenellated",
      surface: "crenellated",
      channel: "crenellated",
      signal: "crenellated",
      identity: "crenellated",
      presence: "crenellated"
    };

    const crest = () => {
      const signature = Object.entries(battlement)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorbattlement-${signature}`);
    };

    this.timer = setInterval(crest, 9200);
  },

  stop() {
    clearInterval(this.timer);
  }
};
