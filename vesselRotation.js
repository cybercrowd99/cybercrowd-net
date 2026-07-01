// vesselRotation.js
// CyberCrowd Mobile Physics Prototype
// Vessel Rotation Logic + Proximity Heat + Authority Activation
//
// Owns:
// - local touch/pressure physics
// - activation energy math
// - surface vs authority ignition state
//
// Does NOT own:
// - login authority
// - server session authority
// - identity authority
// - EAT minting
// - cookie creation
// - KV writes

const DEFAULTS = {
  radiusM: 0.035,              // half phone-width lever arm in meters
  proximity: 1.0,              // 1.0 = normal touch, 0.1 = deep press
  minProximity: 0.1,           // prevents infinite heat
  maxProximity: 1.0,

  surfaceThreshold: 0.05,
  authorityThreshold: 0.25,

  precision: 6,
};

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, precision = DEFAULTS.precision) {
  const m = 10 ** precision;
  return Math.round(value * m) / m;
}

export function computeActivationState({
  forceN,
  radiusM = DEFAULTS.radiusM,
  proximity = DEFAULTS.proximity,

  minProximity = DEFAULTS.minProximity,
  maxProximity = DEFAULTS.maxProximity,

  surfaceThreshold = DEFAULTS.surfaceThreshold,
  authorityThreshold = DEFAULTS.authorityThreshold,
} = {}) {
  // --- 1. Clean Inputs ---
  const cleanForceN = Math.max(0, toNumber(forceN, 0));
  const cleanRadiusM = Math.max(0, toNumber(radiusM, DEFAULTS.radiusM));

  const cleanProximity = clamp(
    toNumber(proximity, DEFAULTS.proximity),
    minProximity,
    maxProximity
  );

  // --- 2. Torque ---
  // τ = F * R
  const torque = cleanForceN * cleanRadiusM;

  // --- 3. Proximity Heat ---
  // H(P) = 1 + 1/P
  const heat = 1 + (1 / cleanProximity);

  // --- 4. Effective Activation Energy ---
  // E = τ * H(P)
  const E = torque * heat;

  // --- 5. State Machine ---
  let state = 0;
  let label = "idle";

  if (E >= authorityThreshold) {
    state = 2;
    label = "authority_ignition";
  } else if (E >= surfaceThreshold) {
    state = 1;
    label = "surface_shift";
  }

  return {
    state,
    label,

    E: round(E),
    torque: round(torque),
    heat: round(heat),

    input: {
      forceN: round(cleanForceN),
      radiusM: round(cleanRadiusM),
      proximity: round(cleanProximity),
    },

    thresholds: {
      surface: surfaceThreshold,
      authority: authorityThreshold,
    },

    authorityNote:
      state === 2
        ? "LOCAL_IGNITION_ONLY_SERVER_AUTHORITY_REQUIRED"
        : "NO_AUTHORITY_GRANTED",
  };
}

// Optional browser touch helper.
// This converts mobile Touch.force into an estimated Newton value.
// Touch.force is usually 0.0 to 1.0, not real Newtons.
export function computeActivationFromTouch(touch, options = {}) {
  const {
    maxForceN = 2.0,
    fallbackForceN = 0,
    proximity = DEFAULTS.proximity,
    radiusM = DEFAULTS.radiusM,
  } = options;

  const rawForce =
    touch && Number.isFinite(Number(touch.force))
      ? Number(touch.force)
      : 0;

  const normalizedForce = clamp(rawForce, 0, 1);

  const forceN =
    normalizedForce > 0
      ? normalizedForce * maxForceN
      : fallbackForceN;

  return computeActivationState({
    ...options,
    forceN,
    radiusM,
    proximity,
  });
}

// Console proof
const test = computeActivationState({
  forceN: 1.2,
  proximity: 0.4,
});

console.log(test);

// Expected:
// {
//   state: 1,
//   label: "surface_shift",
//   E: 0.147,
//   torque: 0.042,
//   heat: 3.5,
//   ...
// }
