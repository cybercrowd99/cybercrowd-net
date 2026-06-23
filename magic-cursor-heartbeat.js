// magic-cursor-heartbeat.js
// CyberCrowd Magic Cursor — Heartbeat / Presence Core
// Owns: surface presence, operator liveness, stale detection,
// disconnect marking, and movement eligibility checks.
// Does not transport events, move cursor, pair devices, or grant OS control.

const MagicCursorHeartbeat = (() => {
  const STATUS_ALIVE = "alive";
  const STATUS_STALE = "stale";
  const STATUS_DISCONNECTED = "disconnected";

  const DEFAULT_STALE_AFTER_MS = 15000;

  let pulses = {};

  function now() {
    return new Date().toISOString();
  }

  function nowMs() {
    return Date.now();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function makeId(prefix) {
    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }

  function requireSurface(surfaceId) {
    if (!surfaceId) {
      throw new Error("Heartbeat requires surface_id.");
    }
  }

  function pulse({
    surfaceId,
    sessionId = null,
    owner = "none",
    operatorId = null,
    role = "unknown",
    detail = {}
  } = {}) {
    requireSurface(surfaceId);

    const record = {
      heartbeat_id: makeId("mcHeartbeat"),
      surface_id: surfaceId,
      session_id: sessionId,
      owner,
      operator_id: operatorId,
      role,
      status: STATUS_ALIVE,
      last_seen: now(),
      last_seen_ms: nowMs(),
      detail
    };

    pulses[surfaceId] = record;
    return clone(record);
  }

  function get(surfaceId) {
    requireSurface(surfaceId);
    return pulses[surfaceId] ? clone(pulses[surfaceId]) : null;
  }

  function getAll() {
    return clone(Object.values(pulses));
  }

  function markStale(surfaceId, reason = "stale_timeout") {
    requireSurface(surfaceId);

    if (!pulses[surfaceId]) {
      throw new Error("Cannot mark unknown surface stale.");
    }

    pulses[surfaceId] = {
      ...pulses[surfaceId],
      status: STATUS_STALE,
      stale_reason: reason,
      updated_at: now()
    };

    return clone(pulses[surfaceId]);
  }

  function markDisconnected(surfaceId, reason = "manual_disconnect") {
    requireSurface(surfaceId);

    if (!pulses[surfaceId]) {
      throw new Error("Cannot disconnect unknown surface.");
    }

    pulses[surfaceId] = {
      ...pulses[surfaceId],
      status: STATUS_DISCONNECTED,
      disconnect_reason: reason,
      updated_at: now()
    };

    return clone(pulses[surfaceId]);
  }

  function evaluate(surfaceId, { staleAfterMs = DEFAULT_STALE_AFTER_MS } = {}) {
    requireSurface(surfaceId);

    const record = pulses[surfaceId];

    if (!record) {
      return {
        surface_id: surfaceId,
        status: STATUS_DISCONNECTED,
        allowed_to_move: false,
        reason: "no_heartbeat"
      };
    }

    const ageMs = nowMs() - record.last_seen_ms;

    if (record.status === STATUS_DISCONNECTED) {
      return {
        ...clone(record),
        age_ms: ageMs,
        allowed_to_move: false,
        reason: "surface_disconnected"
      };
    }

    if (ageMs > staleAfterMs) {
      pulses[surfaceId] = {
        ...record,
        status: STATUS_STALE,
        stale_reason: "heartbeat_age_exceeded",
        updated_at: now()
      };

      return {
        ...clone(pulses[surfaceId]),
        age_ms: ageMs,
        allowed_to_move: false,
        reason: "heartbeat_stale"
      };
    }

    return {
      ...clone(record),
      age_ms: ageMs,
      allowed_to_move: record.status === STATUS_ALIVE,
      reason: record.status === STATUS_ALIVE ? "heartbeat_alive" : "heartbeat_not_alive"
    };
  }

  function canMove(surfaceId, options = {}) {
    return evaluate(surfaceId, options).allowed_to_move === true;
  }

  function requireAlive(surfaceId, options = {}) {
    const result = evaluate(surfaceId, options);

    if (!result.allowed_to_move) {
      throw new Error(`Movement denied: ${result.reason}.`);
    }

    return true;
  }

  function clear(reason = "manual_clear") {
    const cleared = Object.keys(pulses).length;
    pulses = {};

    return {
      cleared,
      reason,
      timestamp: now()
    };
  }

  return {
    pulse,
    get,
    getAll,
    markStale,
    markDisconnected,
    evaluate,
    canMove,
    requireAlive,
    clear
  };
})();

if (typeof window !== "undefined") {
  window.MagicCursorHeartbeat = MagicCursorHeartbeat;
}

export default MagicCursorHeartbeat;
