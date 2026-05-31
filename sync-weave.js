export default {
  id: "sync-weave",
  organ: "defense",
  version: 1,
  start(engine) {
    const weave = {
      continuity: "tight",
      core: "tight",
      defense: "tight",
      surface: "tight",
      channel: "tight",
      signal: "tight",
      identity: "tight",
      presence: "tight"
    };

    const tighten = () => {
      const signature = Object.entries(weave)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`weave-${signature}`);
    };

    engine.defense.on("alert", () => {
      weave.defense = "reinforce";
      tighten();
      weave.defense = "tight";
    });

    engine.surface.on("state", () => {
      weave.surface = "reinforce";
      tighten();
      weave.surface = "tight";
    });

    this.timer = setInterval(() => tighten(), 4200);
  },
  stop() {
    clearInterval(this.timer);
  }
};
