/**
 * cybercrowd-net/xr-room-viewer.js
 *
 * CyberCrowd XR Room Viewer
 *
 * ONE JOB:
 * Consume the XR room snapshot API and expose
 * the current room state to a NET surface.
 *
 * This is NOT:
 * - XR state storage
 * - room status management
 * - occupant management
 * - scene management
 * - object management
 * - snapshot creation
 * - identity
 * - authentication
 * - rendering engine
 * - AI behavior
 *
 * This only answers:
 * "Can NET retrieve and display the current XR room snapshot?"
 *
 * Flow:
 *
 * NET Surface
 *    ↓
 * xr-room-viewer.js
 *    ↓
 * /api/xr-room-snapshot
 *    ↓
 * XR snapshot response
 */

export async function getXRRoomSnapshot(
  roomId
) {
  if (!roomId) {
    return {
      ok: false,
      error: "ROOM_ID_REQUIRED"
    };
  }

  const response = await fetch(
    "/api/xr-room-snapshot?room_id=" +
    encodeURIComponent(roomId)
  );

  if (!response.ok) {
    return {
      ok: false,
      error: "XR_SNAPSHOT_UNAVAILABLE"
    };
  }

  return response.json();
}

export function normalizeXRView(
  snapshot
) {
  if (
    !snapshot ||
    !snapshot.snapshot
  ) {
    return {
      room_id: null,
      status: null,
      occupants: [],
      scene: null,
      objects: []
    };
  }

  return {
    room_id:
      snapshot.room_id || null,

    status:
      snapshot.snapshot.status || null,

    occupants:
      snapshot.snapshot.occupants || null,

    scene:
      snapshot.snapshot.scene || null,

    objects:
      snapshot.snapshot.objects || null
  };
}
