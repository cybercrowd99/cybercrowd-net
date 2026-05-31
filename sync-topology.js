export default {
  id: "sync-topology",
  organ: "defense",
  version: 1,
  start(engine) {
    const topo = {
      continuity: ["core", "defense"],
      core: ["continuity", "surface", "identity"],
      defense: ["core", "surface"],
      surface: ["channel", "signal"],
      channel: ["surface", "signal"],
      signal: ["channel", "identity"],
      identity: ["core", "presence"],
      presence: ["identity"]
    };

    const emit = () => {
      const signature = Object.entries(topo)
        .map(([k, v]) => `${k}:${v.join(",")}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`topology-${signature}`);
    };

    this.timer = setInterval(() => emit(), 4000);
  },
  stop() {
    clearInterval(this.timer);
  }
};
