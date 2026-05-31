export default {
  id: "sync-defense",
  organ: "defense",
  version: 1,
  start(engine) {
    engine.defense.on("alert", (a) => {
      engine.surface.pulse(`defense-${a.toLowerCase()}`);
      if (a === "breach") engine.defense.flag("defense-critical");
      if (a === "desync") engine.defense.flag("defense-desync");
    });
  }
};
