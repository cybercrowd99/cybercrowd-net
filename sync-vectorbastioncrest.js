export default {
  id: "sync-vectorbastioncrest",
  organ: "defense",
  version: 1,

  start(engine) {
    const crest = {
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
      const signature = Object.entries(crest)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorbastioncrest-${signature}`);
    };

    this.timer = setInterval(reinforce, 9400);
  },

  stop() {
    clearInterval(this.timer);
  }
};
