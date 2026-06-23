// magic-cursor-transport.js
// CyberCrowd Magic Cursor — Transport Shell
// Owns: message shape, local send/receive simulation, transport event log.
// Does not use WebSocket yet, move OS cursor, access clipboard, drag files, or pair devices.

const MagicCursorTransport = (() => {
  let messages = [];
  let handlers = {};

  function now() {
    return new Date().toISOString();
  }

  function makeId(prefix) {
    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeMessage(input = {}) {
    if (!input.session_id) throw new Error("Transport message requires session_id.");
    if (!input.source_surface_id) throw new Error("Transport message requires source_surface_id.");
    if (!input.target_surface_id) throw new Error("Transport message requires target_surface_id.");
    if (!input.type) throw new Error("Transport message requires type.");

    return {
      message_id: input.message_id || makeId("mcTransport"),
      replay_id: input.replay_id || makeId("mcReplay"),
      session_id: input.session_id,
      source_surface_id: input.source_surface_id,
      target_surface_id: input.target_surface_id,
      type: input.type,
      status: input.status || "sent",
      timestamp: input.timestamp || now(),
      payload: input.payload || {}
    };
  }

  function on(type, handler) {
    if (!type) throw new Error("Transport handler requires type.");
    if (typeof handler !== "function") throw new Error("Transport handler must be a function.");

    handlers[type] = handler;

    return {
      type,
      registered_at: now()
    };
  }

  function send(input = {}) {
    const message = normalizeMessage(input);
    messages.push(message);

    const handler = handlers[message.type];

    if (handler) {
      handler(clone(message));
    }

    return clone(message);
  }

  function receive(input = {}) {
    const message = normalizeMessage({
      ...input,
      status: input.status || "received"
    });

    messages.push(message);
    return clone(message);
  }

  function hello({ sessionId, sourceSurfaceId, targetSurfaceId } = {}) {
    return send({
      session_id: sessionId,
      source_surface_id: sourceSurfaceId,
      target_surface_id: targetSurfaceId,
      type: "transport_hello",
      payload: {
        message: "hello"
      }
    });
  }

  function ready({ sessionId, sourceSurfaceId, targetSurfaceId } = {}) {
    return send({
      session_id: sessionId,
      source_surface_id: sourceSurfaceId,
      target_surface_id: targetSurfaceId,
      type: "transport_ready",
      payload: {
        message: "ready"
      }
    });
  }

  function deny({ sessionId, sourceSurfaceId, targetSurfaceId, reason = "transport_denied" } = {}) {
    return send({
      session_id: sessionId,
      source_surface_id: sourceSurfaceId,
      target_surface_id: targetSurfaceId,
      type: "transport_denied",
      status: "denied",
      payload: {
        reason
      }
    });
  }

  function getAll() {
    return clone(messages);
  }

  function getBySession(sessionId) {
    if (!sessionId) throw new Error("sessionId is required.");

    return clone(messages.filter((message) => message.session_id === sessionId));
  }

  function clear(reason = "manual_clear") {
    const cleared = messages.length;
    messages = [];

    return {
      cleared,
      reason,
      timestamp: now()
    };
  }

  return {
    on,
    send,
    receive,
    hello,
    ready,
    deny,
    getAll,
    getBySession,
    clear
  };
})();

if (typeof window !== "undefined") {
  window.MagicCursorTransport = MagicCursorTransport;
}

export default MagicCursorTransport;
