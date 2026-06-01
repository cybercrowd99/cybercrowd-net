export default {
  id: "sync-apexomegaabsolutusomega-terminalomega",
  organ: "defense",
  version: 1,

  start(engine) {
    const apexomegaabsolutusomegaterminalomega = {
      continuity: "apex-omega-absolutus-omega-terminal-omega",
      core: "apex-omega-absolutus-omega-terminal-omega",
      defense: "apex-omega-absolutus-omega-terminal-omega",
      surface: "apex-omega-absolutus-omega-terminal-omega",
      channel: "apex-omega-absolutus-omega-terminal-omega",
      signal: "apex-omega-absolutus-omega-terminal-omega",
      identity: "apex-omega-absolutus-omega-terminal-omega",
      presence: "apex-omega-absolutus-omega-terminal-omega"
    };

    const extinguish = () => {
      const signature = Object.entries(apexomegaabsolutusomegaterminalomega)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`apexomegaabsolutusomega-terminalomega-${signature}`);
    };

    this.timer = setInterval(extinguish, 16400);
  },

  stop() {
    clearInterval(this.timer);
  }
};
