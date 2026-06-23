// magic-cursor-surface-registry.js
// CyberCrowd Magic Cursor — Surface Registry Core
// Owns: assigned surfaces, surface roles, dock state, visibility state,
// and surface/session assignment for Layer 0 before live transport.

const MagicCursorSurfaceRegistry = (() => {
  const STATE_AVAILABLE = "available";
  const STATE_ASSIGNED = "assigned";
  const STATE_DOCKED = "docked";
  const STATE_UNDOCKED = "undocked";
  const STATE_PINNED = "pinned";
  const STATE_DISABLED = "disabled";

  const VISIBILITY_PRIVATE = "private";
  const VISIBILITY_SESSION = "session";
  const VISIBILITY_SHARED = "shared";

  let surfaces = {};

  function now() {
    return new Date().toISOString();
  }

  function makeId(prefix) {
    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function requireSurface(surfaceId) {
    if (!surfaceId || !surfaces[surfaceId]) {
      throw new Error("Unknown Magic Cursor surface.");
    }

    return surfaces[surfaceId];
  }

  function createSurface({
    surfaceId = makeId("mcSurface"),
    name = "Assigned Surface",
    type = "generic",
    role = "observer",
    ownerId = null,
    sessionId = null,
    visibility = VISIBILITY_PRIVATE,
    state = STATE_AVAILABLE,
    metadata = {}
  } = {}) {
    if (surfaces[surfaceId]) {
      throw new Error("Magic Cursor surface already exists.");
    }

    const surface = {
      surface_id: surfaceId,
      name,
      type,
      role,
      owner_id: ownerId,
      session_id: sessionId,
      visibility,
      state,
      dock_state: STATE_DOCKED,
      created_at: now(),
      updated_at: now(),
      metadata
    };

    surfaces[surfaceId] = surface;
    return clone(surface);
  }

  function assignSurface({ surfaceId, ownerId, sessionId = null, role = null } = {}) {
    const surface = requireSurface(surfaceId);

    surface.owner_id = ownerId;
    surface.session_id = sessionId;
    surface.state = STATE_ASSIGNED;

    if (role) {
      surface.role = role;
    }

    surface.updated_at = now();
    return clone(surface);
  }

  function releaseSurface(surfaceId, reason = "manual_release") {
    const surface = requireSurface(surfaceId);

    surface.owner_id = null;
    surface.session_id = null;
    surface.state = STATE_AVAILABLE;
    surface.metadata = {
      ...surface.metadata,
      last_release_reason: reason
    };
    surface.updated_at = now();

    return clone(surface);
  }

  function setDockState(surfaceId, dockState) {
    const allowed = [STATE_DOCKED, STATE_UNDOCKED, STATE_PINNED];

    if (!allowed.includes(dockState)) {
      throw new Error("Invalid Magic Cursor dock state.");
    }

    const surface = requireSurface(surfaceId);
    surface.dock_state = dockState;
    surface.updated_at = now();

    return clone(surface);
  }

  function setVisibility(surfaceId, visibility) {
    const allowed = [VISIBILITY_PRIVATE, VISIBILITY_SESSION, VISIBILITY_SHARED];

    if (!allowed.includes(visibility)) {
      throw new Error("Invalid Magic Cursor visibility.");
    }

    const surface = requireSurface(surfaceId);
    surface.visibility = visibility;
    surface.updated_at = now();

    return clone(surface);
  }

  function disableSurface(surfaceId, reason = "manual_disable") {
    const surface = requireSurface(surfaceId);

    surface.state = STATE_DISABLED;
    surface.metadata = {
      ...surface.metadata,
      disabled_reason: reason
    };
    surface.updated_at = now();

    return clone(surface);
  }

  function heartbeat(surfaceId) {
    const surface = requireSurface(surfaceId);

    surface.last_seen = now();
    surface.updated_at = now();

    return clone(surface);
  }

  function getSurface(surfaceId) {
    return clone(requireSurface(surfaceId));
  }

  function getAllSurfaces() {
    return clone(Object.values(surfaces));
  }

  function getBySession(sessionId) {
    return clone(
      Object.values(surfaces).filter((surface) => surface.session_id === sessionId)
    );
  }

  function clear(reason = "manual_clear") {
    const cleared = Object.keys(surfaces).length;
    surfaces = {};

    return {
      cleared,
      reason,
      timestamp: now()
    };
  }

  return {
    createSurface,
    assignSurface,
    releaseSurface,
    setDockState,
    setVisibility,
    disableSurface,
    heartbeat,
    getSurface,
    getAllSurfaces,
    getBySession,
    clear
  };
})();

if (typeof window !== "undefined") {
  window.MagicCursorSurfaceRegistry = MagicCursorSurfaceRegistry;
}

export default MagicCursorSurfaceRegistry;
