export default {
  id: "sync-surface",
  organ: "defense",
  version: 1,
  start(engine) {
    engine.surface.on("state", (s) => {
      engine.surface.pulse(`surface-${s.toLowerCase()}`);
      if (s === "void") engine.defense.flag("surface-desync");
    });
  }
};
