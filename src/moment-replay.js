// src/moment-replay.js
// CyberCrowd Mobile Physics Prototype
// Moment Replay
//
// Purpose:
// Replay recorded vessel moments or shaped packets as a controlled local flow.
//
// Owns:
// - local replay state
// - replay queue creation
// - replay timing
// - replay stepping
// - replay event dispatch
// - pause / resume / stop / reset
//
// Does NOT own:
// - touch physics math
// - vessel activation calculation
// - visual effects
// - identity authority
// - login authority
// - password validation
// - server session authority
// - EAT minting
// - cookie creation
// - KV writes
// - final identity verification
// - movement authorization

const DEFAULTS = {
  eventName: "cybercrowd:moment-replay",
  completeEventName: "cybercrowd:moment-replay-complete",
  intervalMs: 120,
  loop: false,
  maxReplayItems: 100,
};

let replayQueue = [];
let replayIndex = 0;
let replayTimer = null;
let replayRunning = false;
let replayPaused = false;
let replayStartedAt = null;
let lastReplayPacket = null;

function nowISO() {
  return new Date().toISOString();
}

function nowMs() {
  return Date.now();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeReplayId(prefix = "momentReplay") {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeReplayItems(items, maxReplayItems) {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => item && typeof item === "object")
    .slice(0, maxReplayItems)
    .map((item, index) => ({
      replayItemId: makeReplayId("replayItem"),
      loadedAt: nowISO(),
      originalIndex: index,
      payload: clone(item),
    }));
}

function dispatchReplayEvent(target, eventName, detail) {
  if (!target || typeof target.dispatchEvent !== "function") return;

  target.dispatchEvent(
    new CustomEvent(eventName, {
      bubbles: true,
      detail,
    })
  );
}

function buildReplayPacket(item, options = {}) {
  const {
    replayId,
    total,
    startedAt,
  } = options;

  const replayedAtMs = nowMs();

  return {
    ok: true,
    replayId,
    replayedAt: nowISO(),
    replayedAtMs,

    index: replayIndex,
    total,
    fresh: replayIndex === 0,

    timing: {
      startedAt,
      elapsedMs: replayStartedAt ? replayedAtMs - replayStartedAt : 0,
    },

    continuity: {
      previousIndex: replayIndex > 0 ? replayIndex - 1 : null,
      nextIndex: replayIndex + 1 < total ? replayIndex + 1 : null,
    },

    payload: clone(item.payload),

    authorityNote: "LOCAL_REPLAY_ONLY_NO_SERVER_AUTHORITY_GRANTED",
  };
}

function clearTimer() {
  if (replayTimer) {
    clearInterval(replayTimer);
    replayTimer = null;
  }
}

export function loadMomentReplay(items = [], options = {}) {
  const {
    maxReplayItems = DEFAULTS.maxReplayItems,
  } = options;

  replayQueue = normalizeReplayItems(items, maxReplayItems);
  replayIndex = 0;
  replayPaused = false;
  replayRunning = false;
  replayStartedAt = null;
  lastReplayPacket = null;
  clearTimer();

  return {
    ok: true,
    loaded: replayQueue.length,
    ready: replayQueue.length > 0,
    loadedAt: nowISO(),
    authorityNote: "LOCAL_REPLAY_QUEUE_ONLY_NO_SERVER_AUTHORITY_GRANTED",
  };
}

export function startMomentReplay(options = {}) {
  const {
    target = document,
    eventName = DEFAULTS.eventName,
    completeEventName = DEFAULTS.completeEventName,
    intervalMs = DEFAULTS.intervalMs,
    loop = DEFAULTS.loop,
  } = options;

  if (!replayQueue.length) {
    return {
      ok: false,
      reason: "REPLAY_QUEUE_EMPTY",
    };
  }

  clearTimer();

  const replayId = makeReplayId();
  replayRunning = true;
  replayPaused = false;
  replayStartedAt = nowMs();

  function emitCurrent() {
    if (!replayRunning || replayPaused) return;

    const item = replayQueue[replayIndex];

    if (!item) {
      stopMomentReplay({
        target,
        completeEventName,
        reason: "REPLAY_COMPLETE",
      });
      return;
    }

    const packet = buildReplayPacket(item, {
      replayId,
      total: replayQueue.length,
      startedAt: replayStartedAt,
    });

    lastReplayPacket = packet;

    dispatchReplayEvent(target, eventName, packet);

    replayIndex += 1;

    if (replayIndex >= replayQueue.length) {
      if (loop) {
        replayIndex = 0;
        return;
      }

      stopMomentReplay({
        target,
        completeEventName,
        reason: "REPLAY_COMPLETE",
      });
    }
  }

  emitCurrent();

  replayTimer = setInterval(emitCurrent, intervalMs);

  return {
    ok: true,
    replayId,
    running: true,
    paused: false,
    total: replayQueue.length,
    intervalMs,
    loop,
    startedAt: nowISO(),
    authorityNote: "LOCAL_REPLAY_STARTED_NO_SERVER_AUTHORITY_GRANTED",
  };
}

export function pauseMomentReplay() {
  if (!replayRunning) {
    return {
      ok: false,
      reason: "REPLAY_NOT_RUNNING",
    };
  }

  replayPaused = true;

  return {
    ok: true,
    running: replayRunning,
    paused: true,
    pausedAt: nowISO(),
  };
}

export function resumeMomentReplay() {
  if (!replayRunning) {
    return {
      ok: false,
      reason: "REPLAY_NOT_RUNNING",
    };
  }

  replayPaused = false;

  return {
    ok: true,
    running: true,
    paused: false,
    resumedAt: nowISO(),
  };
}

export function stopMomentReplay(options = {}) {
  const {
    target = document,
    completeEventName = DEFAULTS.completeEventName,
    reason = "REPLAY_STOPPED",
  } = options;

  clearTimer();

  const stoppedPacket = {
    ok: true,
    running: false,
    paused: false,
    reason,
    stoppedAt: nowISO(),
    index: replayIndex,
    total: replayQueue.length,
    lastReplayPacket: lastReplayPacket ? clone(lastReplayPacket) : null,
    authorityNote: "LOCAL_REPLAY_STOPPED_NO_SERVER_AUTHORITY_GRANTED",
  };

  replayRunning = false;
  replayPaused = false;

  dispatchReplayEvent(target, completeEventName, stoppedPacket);

  return stoppedPacket;
}

export function stepMomentReplay(options = {}) {
  const {
    target = document,
    eventName = DEFAULTS.eventName,
  } = options;

  if (!replayQueue.length) {
    return {
      ok: false,
      reason: "REPLAY_QUEUE_EMPTY",
    };
  }

  if (replayIndex >= replayQueue.length) {
    return {
      ok: false,
      reason: "REPLAY_AT_END",
    };
  }

  const replayId = makeReplayId("momentReplayStep");

  if (!replayStartedAt) {
    replayStartedAt = nowMs();
  }

  const item = replayQueue[replayIndex];

  const packet = buildReplayPacket(item, {
    replayId,
    total: replayQueue.length,
    startedAt: replayStartedAt,
  });

  lastReplayPacket = packet;
  dispatchReplayEvent(target, eventName, packet);

  replayIndex += 1;

  return clone(packet);
}

export function readMomentReplayState() {
  return {
    ok: true,
    running: replayRunning,
    paused: replayPaused,
    index: replayIndex,
    total: replayQueue.length,
    remaining: Math.max(0, replayQueue.length - replayIndex),
    startedAtMs: replayStartedAt,
    lastReplayPacket: lastReplayPacket ? clone(lastReplayPacket) : null,
    readAt: nowISO(),
    authorityNote: "LOCAL_REPLAY_STATE_ONLY_NO_SERVER_AUTHORITY_GRANTED",
  };
}

export function getReplayQueue() {
  return clone(replayQueue);
}

export function resetMomentReplay() {
  clearTimer();

  replayQueue = [];
  replayIndex = 0;
  replayRunning = false;
  replayPaused = false;
  replayStartedAt = null;
  lastReplayPacket = null;

  return {
    ok: true,
    reset: true,
    resetAt: nowISO(),
    authorityNote: "LOCAL_REPLAY_RESET_NO_SERVER_AUTHORITY_GRANTED",
  };
}

export const MomentReplay = {
  loadMomentReplay,
  startMomentReplay,
  pauseMomentReplay,
  resumeMomentReplay,
  stopMomentReplay,
  stepMomentReplay,
  readMomentReplayState,
  getReplayQueue,
  resetMomentReplay,
};
