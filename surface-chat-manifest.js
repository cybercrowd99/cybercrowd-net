export const SurfaceChatManifest = {
  id: "surface.chat",
  version: 1,
  routes: {
    window: "/surface-chat-window.html",
    assistantEndpoint: "/surface-chat-assistant-endpoint"
  },
  assets: [
    "surface-chat-kernel.js",
    "surface-chat-message-bus.js",
    "surface-chat-render-engine.js",
    "surface-chat-input-rail.js",
    "surface-chat-continuity-engine.js",
    "surface-chat-lifecycle-hooks.js",
    "surface-chat-assistant-bridge.js"
  ],
  lifecycle: {
    onActivate: "mount",
    onDeactivate: "unmount"
  },
  heartbeat: {
    enabled: true,
    interval: 1000
  }
};
