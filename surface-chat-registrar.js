import { SurfaceChatManifest } from "./surface-chat-manifest.js";

export class SurfaceChatRegistrar {
  constructor({ registry, heartbeat }) {
    this.registry = registry;
    this.heartbeat = heartbeat;
  }

  register() {
    const manifest = SurfaceChatManifest;

    if (!manifest || !manifest.id) {
      throw new Error("Invalid chat surface manifest.");
    }

    // install into registry
    this.registry.registerSurface({
      id: manifest.id,
      routes: manifest.routes,
      assets: manifest.assets,
      lifecycle: manifest.lifecycle
    });

    // bind heartbeat if enabled
    if (manifest.heartbeat && manifest.heartbeat.enabled) {
      this.heartbeat.enableForSurface(
        manifest.id,
        manifest.heartbeat.interval
      );
    }

    return manifest.id;
  }
}
