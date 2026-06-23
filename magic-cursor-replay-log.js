// magic-cursor-replay-log.js
// CyberCrowd Magic Cursor — Replay Log Core
// Owns: replay event creation, replay storage, replay reads,
// replay clearing, and replay export for Layer 0 testing.

const MagicCursorReplayLog = (() => {
  let events = [];

  function now() {
    return new Date().toISOString();
  }

  function makeId(prefix) {
    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeEvent(input = {}) {
    if (!input.session_id) {
      throw new Error("Replay event requires session_id.");
    }

    if (!input.type) {
      throw new Error("Replay event requires type.");
    }

    return {
      replay_id: input.replay_id || makeId("mcReplay"),
      session_id: input.session_id,
      type: input.type,
      owner: input.owner || "none",
      status: input.status || "unknown",
      timestamp: input.timestamp || now(),
      detail: input.detail || {}
    };
  }

  function record(input = {}) {
    const event = normalizeEvent(input);
    events.push(event);
    return clone(event);
  }

  function recordMany(list = []) {
    if (!Array.isArray(list)) {
      throw new Error("recordMany requires an array.");
    }

    return list.map((item) => record(item));
  }

  function getAll() {
    return clone(events);
  }

  function getBySession(sessionId) {
    if (!sessionId) {
      throw new Error("sessionId is required.");
    }

    return clone(events.filter((event) => event.session_id === sessionId));
  }

  function getLast() {
    if (!events.length) return null;
    return clone(events[events.length - 1]);
  }

  function clear(reason = "manual_clear") {
    const cleared = events.length;

    events = [];

    return {
      cleared,
      reason,
      timestamp: now()
    };
  }

  function exportJson() {
    return JSON.stringify(events, null, 2);
  }

  function importJson(json) {
    let parsed;

    try {
      parsed = JSON.parse(json);
    } catch (error) {
      throw new Error("Invalid replay JSON.");
    }

    if (!Array.isArray(parsed)) {
      throw new Error("Replay JSON must contain an array.");
    }

    events = parsed.map((item) => normalizeEvent(item));
    return getAll();
  }

  return {
    record,
    recordMany,
    getAll,
    getBySession,
    getLast,
    clear,
    exportJson,
    importJson
  };
})();

if (typeof window !== "undefined") {
  window.MagicCursorReplayLog = MagicCursorReplayLog;
}

export default MagicCursorReplayLog;
