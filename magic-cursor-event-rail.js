// magic-cursor-event-rail.js
// CyberCrowd Magic Cursor — Event Rail Core
// Owns: cursor intent events only.
// Does not move the OS cursor, access clipboard, drag files, or control devices.

const MagicCursorEventRail = (() => {
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

  function requireBaseEvent(input = {}) {
    if (!input.session_id) throw new Error("Cursor event requires session_id.");
    if (!input.surface_id) throw new Error("Cursor event requires surface_id.");
    if (!input.owner) throw new Error("Cursor event requires owner.");
  }

  function recordEvent(type, input = {}) {
    requireBaseEvent(input);

    const event = {
      event_id: makeId("mcEvent"),
      replay_id: input.replay_id || makeId("mcReplay"),
      session_id: input.session_id,
      surface_id: input.surface_id,
      owner: input.owner,
      type,
      x: Number.isFinite(input.x) ? input.x : null,
      y: Number.isFinite(input.y) ? input.y : null,
      button: input.button || null,
      status: input.status || "simulated",
      authority_state: input.authority_state || "unverified",
      timestamp: now(),
      detail: input.detail || {}
    };

    events.push(event);
    return clone(event);
  }

  function move(input = {}) {
    return recordEvent("cursor_move", input);
  }

  function click(input = {}) {
    return recordEvent("cursor_click", {
      ...input,
      button: input.button || "primary"
    });
  }

  function press(input = {}) {
    return recordEvent("cursor_press", {
      ...input,
      button: input.button || "primary"
    });
  }

  function release(input = {}) {
    return recordEvent("cursor_release", {
      ...input,
      button: input.button || "primary"
    });
  }

  function edgeCross(input = {}) {
    return recordEvent("cursor_edge_cross", input);
  }

  function deny(input = {}) {
    return recordEvent("cursor_event_denied", {
      ...input,
      status: "denied"
    });
  }

  function getAll() {
    return clone(events);
  }

  function getBySession(sessionId) {
    if (!sessionId) throw new Error("sessionId is required.");

    return clone(events.filter((event) => event.session_id === sessionId));
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

  return {
    move,
    click,
    press,
    release,
    edgeCross,
    deny,
    getAll,
    getBySession,
    clear
  };
})();

if (typeof window !== "undefined") {
  window.MagicCursorEventRail = MagicCursorEventRail;
}

export default MagicCursorEventRail;
