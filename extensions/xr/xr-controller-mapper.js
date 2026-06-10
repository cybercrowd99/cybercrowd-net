// xr-controller-mapper.js
// Maps VR controllers + hand tracking → CyberCrowd operator actions.
// Integrates with xr-room.js and CyberCrowd's existing command bus.

import * as THREE from "three";

const XRControllerMapper = {
  controllers: [],
  raycaster: new THREE.Raycaster(),
  tempMatrix: new THREE.Matrix4(),

  init(renderer, scene, camera) {
    XRControllerMapper.scene = scene;
    XRControllerMapper.camera = camera;

    // Create two controller slots (left + right)
    for (let i = 0; i < 2; i++) {
      const controller = renderer.xr.getController(i);
      controller.userData.index = i;

      controller.addEventListener("selectstart", XRControllerMapper.onTriggerDown);
      controller.addEventListener("selectend", XRControllerMapper.onTriggerUp);
      controller.addEventListener("squeezestart", XRControllerMapper.onGripDown);
      controller.addEventListener("squeezeend", XRControllerMapper.onGripUp);

      XRControllerMapper.controllers.push(controller);
      scene.add(controller);
    }

    // Optional: hand tracking
    for (let i = 0; i < 2; i++) {
      const hand = renderer.xr.getHand(i);
      hand.userData.index = i;
      hand.addEventListener("pinchstart", XRControllerMapper.onPinchStart);
      hand.addEventListener("pinchend", XRControllerMapper.onPinchEnd);
      scene.add(hand);
    }
  },

  /* ────────────────────────────────────────────────
     TRIGGER → surface click / select
     ──────────────────────────────────────────────── */
  onTriggerDown(event) {
    const controller = event.target;
    const hit = XRControllerMapper.raycast(controller);

    if (hit) {
      XRControllerMapper.sendCommand("surface.select", {
        surfaceId: hit.object.userData.surfaceId,
        point: hit.point
      });
    }
  },

  onTriggerUp(event) {
    const controller = event.target;
    const hit = XRControllerMapper.raycast(controller);

    if (hit) {
      XRControllerMapper.sendCommand("surface.release", {
        surfaceId: hit.object.userData.surfaceId
      });
    }
  },

  /* ────────────────────────────────────────────────
     GRIP → drag / move surface
     ──────────────────────────────────────────────── */
  onGripDown(event) {
    const controller = event.target;
    const hit = XRControllerMapper.raycast(controller);

    if (hit) {
      XRControllerMapper.sendCommand("surface.drag.start", {
        surfaceId: hit.object.userData.surfaceId,
        controller: controller.userData.index
      });
    }
  },

  onGripUp(event) {
    XRControllerMapper.sendCommand("surface.drag.end", {});
  },

  /* ────────────────────────────────────────────────
     HAND TRACKING → pinch = grab
     ──────────────────────────────────────────────── */
  onPinchStart(event) {
    const hand = event.target;
    const hit = XRControllerMapper.raycast(hand);

    if (hit) {
      XRControllerMapper.sendCommand("surface.drag.start", {
        surfaceId: hit.object.userData.surfaceId,
        controller: `hand-${hand.userData.index}`
      });
    }
  },

  onPinchEnd(event) {
    XRControllerMapper.sendCommand("surface.drag.end", {});
  },

  /* ────────────────────────────────────────────────
     RAYCASTING
     ──────────────────────────────────────────────── */
  raycast(controller) {
    if (!controller) return null;

    XRControllerMapper.tempMatrix.identity().extractRotation(controller.matrixWorld);

    const origin = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
    const direction = new THREE.Vector3(0, 0, -1).applyMatrix4(XRControllerMapper.tempMatrix);

    XRControllerMapper.raycaster.set(origin, direction);

    const intersects = XRControllerMapper.raycaster.intersectObjects(
      XRControllerMapper.scene.children,
      true
    );

    return intersects.find(hit => hit.object.userData.surfaceId) || null;
  },

  /* ────────────────────────────────────────────────
     COMMAND BUS → CyberCrowd sovereign mesh
     ──────────────────────────────────────────────── */
  sendCommand(type, payload) {
    try {
      if (window.CyberCrowd && window.CyberCrowd.commandBus) {
        window.CyberCrowd.commandBus.emit(type, payload);
      } else {
        console.warn("CyberCrowd command bus not available:", type, payload);
      }
    } catch (err) {
      console.error("XR command dispatch failed:", err);
    }
  }
};

export default XRControllerMapper;
