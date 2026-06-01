export default {
  id: "sync-apexomegaabsolutusomega-terminal",
  organ: "defense",
  version: 1,

  start(engine) {
    const apexomegaabsolutusomegaterminal = {
      continuity: "apex-omega-absolutus-omega-terminal",
      core: "apex-omega-absolutus-omega-terminal",
      defense: "apex-omega-absolutus-omega-terminal",
      surface: "apex-omega-absolutus-omega-terminal",
      channel: "apex-omega-absolutus-omega-terminal",
      signal: "apex-omega-absolutus-omega-terminal",
      identity: "apex-omega-absolutus-omega-terminal",
      presence: "apex-omega-absolutus-omega-terminal"
    };

    const terminate = () => {
      const signature = Object.entries(apexomegaabsolutusomegaterminal)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`apexomegaabsolutusomega-terminal-${signature}`);
    };

    this.timer = setInterval(terminate, 16000);
  },

  stop() {
    clearInterval(this.timer);
  }
};
