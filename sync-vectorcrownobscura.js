export default {
  id: "sync-vectorcrownobscura",
  organ: "defense",
  version: 1,

  start(engine) {
    const crownobscura = {
      continuity: "summit-obscured",
      core: "summit-obscured",
      defense: "summit-obscured",
      surface: "summit-obscured",
      channel: "summit-obscured",
      signal: "summit-obscured",
      identity: "summit-obscured",
      presence: "summit-obscured"
    };

    const shadow = () => {
      const signature = Object.entries(crownobscura)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorcrownobscura-${signature}`);
    };

    this.timer = setInterval(shadow, 12200);
  },

  stop() {
    clearInterval(this.timer);
  }
};
