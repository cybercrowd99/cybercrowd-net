export default {
  id: "sync-signal",
  organ: "defense",
  version: 1,
  start(engine) {
    engine.surface.on("signal", (sig) => {
      if (sig === "PING") engine.surface.pulse("signal-ping");
      if (sig === "DROP") engine.defense.flag("signal-drop");
      if (sig === "ECHO") engine.surface.pulse("signal-echo");
    });
  }
};
