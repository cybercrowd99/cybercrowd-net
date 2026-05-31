export default {
  id: "sync-vectorparapet",
  organ: "defense",
  version: 1,

  start(engine) {
    const parapet = {
      continuity: "crest",
      core: "crest",
      defense: "crest",
      surface: "crest",
      channel: "crest",
      signal: "crest",
      identity: "crest",
      presence: "crest"
    };

    const shield = () => {
      const signature = Object.entries(parapet)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorparapet-${signature}`);
    };

    this.timer = setInterval(shield, 9000);
  },

  stop() {
    clearInterval(this.timer);
  }
};
