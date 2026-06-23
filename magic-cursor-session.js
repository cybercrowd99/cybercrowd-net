// magic-cursor-session.js
// CyberCrowd Magic Cursor — Session Authority Core
// Owns: session creation, device registration, current owner,
// ownership transfer, replay IDs, freeze/close behavior.

const MagicCursorSession = (() => {
  const OWNER_NONE = "none";
  const STATUS_ACTIVE = "active";
  const STATUS_FROZEN = "frozen";
  const STATUS_CLOSED = "closed";

  let session = null;

  function now() {
    return new Date().toISOString();
  }

  function makeId(prefix) {
    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createReplayEvent(type, detail = {}) {
    if (!session) {
      throw new Error("No Magic Cursor session exists.");
    }

    const event = {
      replay_id: makeId("mcReplay"),
      session_id: session.session_id,
      type,
      owner: session.owner,
      status: session.status,
      timestamp: now(),
      detail
    };

    session.replay.push(event);
    return event;
  }

  function createSession({ hostDeviceId = "laptop", hostLabel = "Laptop Host" } = {}) {
    session = {
      session_id: makeId("mcSession"),
      created_at: now(),
      updated_at: now(),
      status: STATUS_ACTIVE,
      owner: hostDeviceId,
      devices: {
        [hostDeviceId]: {
          device_id: hostDeviceId,
          label: hostLabel,
          role: "host",
          joined_at: now(),
          last_seen: now(),
          trusted: true
        }
      },
      transfer_state: "none",
      replay: []
    };

    createReplayEvent("session_created", {
      hostDeviceId,
      hostLabel
    });

    createReplayEvent("owner_assigned", {
      owner: hostDeviceId,
      reason: "initial_host_owner"
    });

    return clone(session);
  }

  function requireSession() {
    if (!session) {
      throw new Error("Magic Cursor session has not been created.");
    }

    if (session.status === STATUS_CLOSED) {
      throw new Error("Magic Cursor session is closed.");
    }
  }

  function joinDevice({ deviceId, label = "Client Device", role = "client" }) {
    requireSession();

    if (!deviceId) {
      throw new Error("deviceId is required.");
    }

    session.devices[deviceId] = {
      device_id: deviceId,
      label,
      role,
      joined_at: now(),
      last_seen: now(),
      trusted: true
    };

    session.updated_at = now();

    createReplayEvent("device_joined", {
      deviceId,
      label,
      role
    });

    return clone(session);
  }

  function heartbeat(deviceId) {
    requireSession();

    if (!session.devices[deviceId]) {
      throw new Error(`Unknown device: ${deviceId}`);
    }

    session.devices[deviceId].last_seen = now();
    session.updated_at = now();

    return clone(session);
  }

  function transferOwnership({ fromDeviceId, toDeviceId }) {
    requireSession();

    if (session.status !== STATUS_ACTIVE) {
      throw new Error(`Cannot transfer ownership while session is ${session.status}.`);
    }

    if (!session.devices[fromDeviceId]) {
      throw new Error(`Unknown origin device: ${fromDeviceId}`);
    }

    if (!session.devices[toDeviceId]) {
      throw new Error(`Unknown target device: ${toDeviceId}`);
    }

    if (session.owner !== fromDeviceId) {
      createReplayEvent("transfer_denied", {
        fromDeviceId,
        toDeviceId,
        reason: "origin_does_not_own_cursor",
        currentOwner: session.owner
      });

      throw new Error("Transfer denied: origin device does not own cursor authority.");
    }

    session.transfer_state = "handoff_pending";

    createReplayEvent("handoff_pending", {
      fromDeviceId,
      toDeviceId
    });

    session.owner = toDeviceId;
    session.transfer_state = "handoff_confirmed";
    session.updated_at = now();

    createReplayEvent("handoff_confirmed", {
      fromDeviceId,
      toDeviceId,
      newOwner: toDeviceId
    });

    return clone(session);
  }

  function freeze(reason = "manual_freeze") {
    requireSession();

    session.status = STATUS_FROZEN;
    session.updated_at = now();

    createReplayEvent("session_frozen", {
      reason
    });

    return clone(session);
  }

  function resume(reason = "manual_resume") {
    requireSession();

    if (session.status !== STATUS_FROZEN) {
      throw new Error("Only frozen sessions may resume.");
    }

    session.status = STATUS_ACTIVE;
    session.updated_at = now();

    createReplayEvent("session_resumed", {
      reason
    });

    return clone(session);
  }

  function close(reason = "manual_close") {
    requireSession();

    session.status = STATUS_CLOSED;
    session.owner = OWNER_NONE;
    session.updated_at = now();

    createReplayEvent("session_closed", {
      reason
    });

    return clone(session);
  }

  function getSession() {
    return session ? clone(session) : null;
  }

  function getReplayLog() {
    return session ? clone(session.replay) : [];
  }

  return {
    createSession,
    joinDevice,
    heartbeat,
    transferOwnership,
    freeze,
    resume,
    close,
    getSession,
    getReplayLog
  };
})();

if (typeof window !== "undefined") {
  window.MagicCursorSession = MagicCursorSession;
}

export default MagicCursorSession;
