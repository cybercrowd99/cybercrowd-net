/* ============================================================
   adWorm — RENDER-AGNOSTIC TRANSFORM ENGINE
   CyberCrowd Layer 1 Broadcast Subsystem
   Purpose: compute geometry, transforms, interpolation
   No DOM. No CSS. No animation.
   ============================================================ */

import { ADWORM_PATH } from "./adworm.foundation.js";

/* ============================================================
   FRAME GEOMETRY MODEL
   ============================================================ */

export const DEFAULT_FRAME = Object.freeze({
  width: 1920,
  height: 1080,
  margin: 32
});

/* ============================================================
   SLOT → COORDINATE MAP
   ============================================================ */

function computeSlotCoordinates(frame) {
  const { width, height, margin } = frame;

  return {
    topLeft:      { x: margin,           y: margin },
    topRail:      { x: width / 2,        y: margin },
    topRight:     { x: width - margin,   y: margin },
    rightRail:    { x: width - margin,   y: height / 2 },
    bottomRight:  { x: width - margin,   y: height - margin },
    bottomRail:   { x: width / 2,        y: height - margin },
    bottomLeft:   { x: margin,           y: height - margin },
    leftRail:     { x: margin,           y: height / 2 }
  };
}

/* ============================================================
   INTERPOLATION
   ============================================================ */

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function interpolatePoints(a, b, t) {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t)
  };
}

/* ============================================================
   MAIN TRANSFORM ENGINE
   ============================================================ */

export class AdWormRenderEngine {
  constructor(frame = DEFAULT_FRAME) {
    this.frame = frame;
    this.coords = computeSlotCoordinates(frame);
  }

  /* ------------------------------------------------------------
     PUBLIC: get absolute coordinates for a node
     ------------------------------------------------------------ */
  getNodePosition(node) {
    const slot = node.slot;
    return this.coords[slot] || { x: 0, y: 0 };
  }

  /* ------------------------------------------------------------
     PUBLIC: interpolate between two nodes
     ------------------------------------------------------------ */
  interpolate(nodeA, nodeB, t) {
    const a = this.getNodePosition(nodeA);
    const b = this.getNodePosition(nodeB);
    return interpolatePoints(a, b, t);
  }

  /* ------------------------------------------------------------
     PUBLIC: compute full transform packet
     ------------------------------------------------------------ */
  getTransformPacket(node, nextNode, t = 0) {
    const pos = this.interpolate(node, nextNode, t);

    return {
      x: pos.x,
      y: pos.y,
      slot: node.slot,
      nextSlot: nextNode.slot,
      t
    };
  }
}

/* ============================================================
   FACTORY
   ============================================================ */

export function createAdWormRenderEngine(frame = DEFAULT_FRAME) {
  return new AdWormRenderEngine(frame);
}
