export default {
  id: "sync-vectorcrownnullfield",
  organ: "defense",
  version: 1,

  start(engine) {
    const crownnullfield = {
      continuity: "summit-null",
      core: "summit-null",
      defense: "summit-null",
      surface: "summit-null",
      channel: "summit-null",
      signal: "summit-null",
      identity: "summit-null",
      presence: "summit-null"
    };

    const cancel = () => {
      const signature = Object.entries(crownnullfield)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorcrownnullfield-${signature}`);
    };

    this.timer = setInterval(cancel, 12000);
  },

  stop() {
    clearInterval(this.timer);
  }
};
