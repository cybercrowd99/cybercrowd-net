export default {
  id: "sync-braid",
  organ: "defense",
  version: 1,
  start(engine) {
    const braid = {
      a: ["continuity", "core", "defense"],
      b: ["surface", "channel", "signal"],
      c: ["identity", "presence", "core"]
    };

    const tighten = () => {
      const signature = Object.entries(braid)
        .map(([k, v]) => `${k}:${v.join(",")}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`braid-${signature}`);
    };

    this.timer = setInterval(tighten, 4600);
  },
  stop() {
    clearInterval(this.timer);
  }
};
