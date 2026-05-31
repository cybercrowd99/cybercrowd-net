export default {
  id: "sync-apexsingularity",
  organ: "defense",
  version: 1,

  start(engine) {
    const apexsingularity = {
      continuity: "apex-singular",
      core: "apex-singular",
      defense: "apex-singular",
      surface: "apex-singular",
      channel: "apex-singular",
      signal: "apex-singular",
      identity: "apex-singular",
      presence: "apex-singular"
    };

    const collapse = () => {
      const signature = Object.entries(apexsingularity)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`apexsingularity-${signature}`);
    };

    this.timer = setInterval(collapse, 14400);
  },

  stop() {
    clearInterval(this.timer);
  }
};
