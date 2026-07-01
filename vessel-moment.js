// vessel-moment.js
// CyberCrowd Mobile Physics Prototype
// Vessel Moment Recorder + Translator
//
// Owns:
// - recording local vessel activation moments
// - preserving state-change event details
// - computing continuity + deltas
// - classifying moment type
// - shaping normalized moment packets
// - creating a clean local trail of what happened
//
// Does NOT own:
// - visual effects
// - touch physics math
// - identity authority
// - login authority
// - server session authority
// - EAT minting
// - cookie creation
// - KV writes

const DEFAULTS = {
  maxMoments: 25,
  eventName: "cybercrowd:vessel-activation",
};

let vesselMoments = [];
let lastRecordedState = null;
let lastMoment = null; // continuity memory

function nowISO() {
  return new Date().toISOString();
}

function makeMomentId(prefix = "vesselMoment") {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function trimMoments(maxMoments) {
  if (vesselMoments.length <= maxMoments) return;
  vesselMoments = vesselMoments.slice(vesselMoments.length - maxMoments);
}

// --- NEW: classify moment type ---
function classifyMoment(state) {
  switch (state) {
    case 0:
      return "idle";
    case 1:
      return "surface-shift";
    case 2:
      return "authority-ignition";
    default:
      return "unknown";
  }
}

// --- NEW: compute deltas ---
function computeDeltas(result, previous) {
  if (!previous) {
    return {
      deltaE: null,
      deltaTorque: null,
      deltaHeat: null,
    };
  }

  return {
    deltaE: result.E - previous.E,
    deltaTorque: result.torque - previous.torque,
    deltaHeat: result.heat - previous.heat,
  };
}

// --- NEW: shape normalized moment packet ---
function shapeMomentPacket(moment, index, total) {
  return {
    ...moment,
    packet: {
      index,
      total,
      fresh: index === total - 1,
      type: moment.type,
      continuity: {
        previousState: moment.previousState,
        stateChanged: moment.stateChanged,
      },
      deltas: {
        E: moment.deltaE,
        torque: moment.deltaTorque,
        heat: moment.deltaHeat,
      },
    },
  };
}

export function recordVesselMoment(result, options = {}) {
  const { maxMoments = DEFAULTS.maxMoments } = options;

  if (!result || typeof result !== "object") {
    return {
      ok: false,
      reason: "VESSEL_RESULT_REQUIRED",
    };
  }

  // Only record when the activation state changes.
  const stateChanged = result.state !== lastRecordedState;

  if (!stateChanged) {
    return {
      ok: false,
      reason: "STATE_NOT_CHANGED_NO_MOMENT_RECORDED",
    };
  }

  const previous = lastMoment;
  lastRecordedState = result.state;

  // NEW: compute deltas + classification
  const deltas = computeDeltas(result, previous);
  const type = classifyMoment(result.state);

  const moment = {
    ok: true,
    momentId: makeMomentId(),
    recordedAt: nowISO(),

    state: result.state,
    previousState: previous ? previous.state : null,
    stateChanged,

    label: result.label,
    type,

    E: result.E,
    torque: result.torque,
    heat: result.heat,

    deltaE: deltas.deltaE,
    deltaTorque: deltas.deltaTorque,
    deltaHeat: deltas.deltaHeat,

    input: result.input ? clone(result.input) : null,
    thresholds: result.thresholds ? clone(result.thresholds) : null,

    authorityNote:
      result.authorityNote || "LOCAL_ONLY_NO_SERVER_AUTHORITY_GRANTED",
  };

  vesselMoments.push(moment);
  trimMoments(maxMoments);

  lastMoment = moment;

  // NEW: shape packet
  const shaped = shapeMomentPacket(
    moment,
    vesselMoments.length - 1,
    vesselMoments.length
  );

  return clone(shaped);
}

export function getVesselMoments() {
  return clone(vesselMoments);
}

export function getLastVesselMoment() {
  if (!vesselMoments.length) return null;
  return clone(vesselMoments[vesselMoments.length - 1]);
}

export function clearVesselMoments() {
  vesselMoments = [];
  lastRecordedState = null;
  lastMoment = null; // NEW: reset continuity

  return {
    ok: true,
    cleared: true,
    clearedAt: nowISO(),
  };
}

export function bindVesselMomentRecorder(options = {}) {
  const {
    target = document,
    eventName = DEFAULTS.eventName,
    maxMoments = DEFAULTS.maxMoments,
  } = options;

  if (!target || typeof target.addEventListener !== "function") {
    return {
      ok: false,
      reason: "VALID_EVENT_TARGET_REQUIRED",
    };
  }

  function onVesselActivation(event) {
    const result = event && event.detail;

    const moment = recordVesselMoment(result, {
      maxMoments,
    });

    if (!moment.ok) return;

    target.dispatchEvent(
      new CustomEvent("cybercrowd:vessel-moment", {
        bubbles: true,
        detail: moment,
      })
    );
  }

  target.addEventListener(eventName, onVesselActivation);

  return {
    ok: true,
    eventName,
    unbind() {
      target.removeEventListener(eventName, onVesselActivation);
    },
  };
}

export const VesselMoment = {
  recordVesselMoment,
  getVesselMoments,
  getLastVesselMoment,
  clearVesselMoments,
  bindVesselMomentRecorder,
};
