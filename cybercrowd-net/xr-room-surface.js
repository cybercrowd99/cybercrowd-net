/**
 * cybercrowd-net/xr-room-surface.js
 *
 * CyberCrowd XR Room Surface
 *
 * ONE JOB:
 * Connect a NET surface to the XR room viewer adapter.
 *
 * This is NOT:
 * - XR state storage
 * - XR state mutation
 * - room status ownership
 * - occupant ownership
 * - scene ownership
 * - object ownership
 * - snapshot aggregation
 * - identity
 * - authentication
 * - rendering engine
 * - AI behavior
 *
 * This only answers:
 * "Can a NET surface request and expose the current XR room view?"
 *
 * Flow:
 *
 * NET Page
 *    ↓
 * xr-room-surface.js
 *    ↓
 * xr-room-viewer.js
 *    ↓
 * /api/xr-room-snapshot
 *    ↓
 * XR room view
 */

import {
  getXRRoomSnapshot,
  normalizeXRView
} from "./xr-room-viewer.js";

export async function loadXRRoomSurface(
  roomId
) {
  const snapshot =
    await getXRRoomSnapshot(roomId);

  const view =
    normalizeXRView(snapshot);

  return {
    ok:
      snapshot.ok !== false,

    view
  };
}
