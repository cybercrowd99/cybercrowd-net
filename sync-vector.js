export default {
  id: "sync-vector",
  organ: "defense",
  version: 1,
  start(engine) {
    const vectors = [
      { axis: "continuity", dir: "forward" },
      { axis: "core", dir: "stable" },
      { axis: "defense", dir: "reinforce" },
      { axis: "surface", dir: "expand" },
      { axis: "channel", dir: "flow" },
      { axis: "signal", dir: "amplify" },
      { axis: "identity", dir: "preserve" },
      { axis: "presence", dir: "project" }
    ];

    const align = () => {
      const signature = vectors
        .map(v => `${v.axis}:${v.dir}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`vector-${signature}`);
    };

    this.timer = setInterval(align, 5400);
  },
  stop() {
    clearInterval(this.timer);
  }
};
