export default {
  id: "sync-apexconvergence",
  organ: "defense",
  version: 1,

  start(engine) {
    const apexconvergence = {
      continuity: "apex-converged",
      core: "apex-converged",
      defense: "apex-converged",
      surface: "apex-converged",
      channel: "apex-converged",
      signal: "apex-converged",
      identity: "apex-converged",
      presence: "apex-converged"
    };

    const converge = () => {
      const signature = Object.entries(apexconvergence)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`apexconvergence-${signature}`);
    };

    this.timer = setInterval(converge, 14000);
  },

  stop() {
    clearInterval(this.timer);
  }
};
