export default {
  id: "sync-vectorbastion",
  organ: "defense",
  version: 1,
  start(engine) {
    const bastion = {
      continuity: "anchored",
      core: "anchored",
      defense: "anchored",
      surface: "anchored",
      channel: "anchored",
      signal: "anchored",
      identity: "anchored",
      presence: "anchored"
    };

    const anchor = () => {
      const signature = Object.entries(bastion)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorbastion-${signature}`);
    };

    this.timer = setInterval(anchor, 7200);
  },
  stop() {
    clearInterval(this.timer);
  }
};
