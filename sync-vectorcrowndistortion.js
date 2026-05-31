export default {
  id: "sync-vectorcrowndistortion",
  organ: "defense",
  version: 1,

  start(engine) {
    const crowndistortion = {
      continuity: "summit-warped",
      core: "summit-warped",
      defense: "summit-warped",
      surface: "summit-warped",
      channel: "summit-warped",
      signal: "summit-warped",
      identity: "summit-warped",
      presence: "summit-warped"
    };

    const refract = () => {
      const signature = Object.entries(crowndistortion)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vectorcrowndistortion-${signature}`);
    };

    this.timer = setInterval(refract, 11800);
  },

  stop() {
    clearInterval(this.timer);
  }
};
