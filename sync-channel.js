export default {
  id: "sync-channel",
  organ: "defense",
  version: 1,
  start(engine) {
    engine.channel.on("update", (ch) => {
      engine.surface.pulse(`channel-${ch.toLowerCase()}`);
      if (ch === "broken") engine.defense.flag("channel-desync");
    });
  }
};
