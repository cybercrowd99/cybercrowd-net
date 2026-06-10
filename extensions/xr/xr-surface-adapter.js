// xr-surface-adapter.js
// Converts CyberCrowd 2D surfaces → 3D XR spatial panels.
// Works with xr-room.js via window.CyberCrowdXR.addPanel()

import * as THREE from "three";

const XRSurfaceAdapter = {
  panels: new Map(),   // surfaceId → { mesh, canvas, ctx, texture }

  /**
   * Register a CyberCrowd surface for XR rendering.
   * surface = { id, element, width, height }
   */
  register(surface) {
    if (!window.CyberCrowdXR) {
      console.warn("XR room not initialized yet.");
      return;
    }

    const { id, element } = surface;
    if (!element) {
      console.error("Surface missing DOM element:", id);
      return;
    }

    // Create a canvas that mirrors the surface
    const canvas = document.createElement("canvas");
    canvas.width = element.offsetWidth;
    canvas.height = element.offsetHeight;
    const ctx = canvas.getContext("2d");

    // Create a Three.js texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    // Create a plane mesh for XR
    const aspect = canvas.width / canvas.height;
    const height = 1.0; // 1 meter tall panel
    const width = height * aspect;

    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 1.5, -2); // default placement

    // Store panel
    XRSurfaceAdapter.panels.set(id, { mesh, canvas, ctx, texture });

    // Add to XR room
    window.CyberCrowdXR.addPanel(mesh);

    // Start update loop
    XRSurfaceAdapter.startUpdateLoop(id, element);
  },

  /**
   * Continuously redraws the DOM surface into the XR canvas.
   */
  startUpdateLoop(id, element) {
    const panel = XRSurfaceAdapter.panels.get(id);
    if (!panel) return;

    const { canvas, ctx, texture } = panel;

    function update() {
      // Draw DOM → canvas
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
        texture.needsUpdate = true;
      } catch (err) {
        // Some surfaces may not be drawable (cross-origin, etc.)
      }

      requestAnimationFrame(update);
    }

    update();
  },

  /**
   * Remove a surface from XR.
   */
  unregister(id) {
    const panel = XRSurfaceAdapter.panels.get(id);
    if (!panel) return;

    window.CyberCrowdXR.removePanel(panel.mesh);
    XRSurfaceAdapter.panels.delete(id);
  }
};

export default XRSurfaceAdapter;
