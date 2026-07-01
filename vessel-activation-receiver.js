// vessel-activation-receiver.js
// CyberCrowd Mobile Physics Prototype
// Vessel Activation Receiver
//
// Owns:
// - listening to vessel activation state
// - translating local physics state into page behavior
// - visual glow / shake / ignition effects
// - optional local sound trigger
//
// Does NOT own:
// - identity authority
// - login authority
// - server session authority
// - EAT minting
// - cookie creation
// - KV writes

import {
  computeActivationFromTouch,
  computeActivationState,
} from "./vesselRotation.js";

const DEFAULTS = {
  targetSelector: "[data-vessel]",
  statusSelector: "[data-vessel-status]",
  proximity: 1.0,
  maxForceN: 2.0,
  fallbackForceN: 0.6,
  ignitionCooldownMs: 900,
};

let lastIgnitionAt = 0;
let lastState = null; // --- PATCH: state-change memory ---

function now() {
  return Date.now();
}

function findTarget(selector) {
  return document.querySelector(selector);
}

function clearActivationClasses(target) {
  target.classList.remove(
    "vessel-idle",
    "vessel-surface-shift",
    "vessel-authority-ignition"
  );
}

function writeStatus(statusEl, result) {
  if (!statusEl) return;

  statusEl.textContent = `${result.label} | E=${result.E}`;
  statusEl.dataset.vesselState = String(result.state);
  statusEl.dataset.vesselEnergy = String(result.E);
}

function playIgnitionSound(sound) {
  if (!sound) return;

  try {
    sound.currentTime = 0;
    sound.play().catch(() => {});
  } catch (_) {
    // Sound is optional. Never break activation because audio failed.
  }
}

function dispatchActivationEvent(target, result) {
  target.dispatchEvent(
    new CustomEvent("cybercrowd:vessel-activation", {
      bubbles: true,
      detail: result,
    })
  );
}

export function applyActivationState(result, options = {}) {
  const {
    targetSelector = DEFAULTS.targetSelector,
    statusSelector = DEFAULTS.statusSelector,
    ignitionSound = null,
    ignitionCooldownMs = DEFAULTS.ignitionCooldownMs,
  } = options;

  const target = findTarget(targetSelector);
  const statusEl = findTarget(statusSelector);

  if (!target || !result) return result;

  clearActivationClasses(target);

  if (result.state === 0) {
    target.classList.add("vessel-idle");
  }

  if (result.state === 1) {
    target.classList.add("vessel-surface-shift");
  }

  if (result.state === 2) {
    target.classList.add("vessel-authority-ignition");

    const elapsed = now() - lastIgnitionAt;

    if (elapsed >= ignitionCooldownMs) {
      lastIgnitionAt = now();
      playIgnitionSound(ignitionSound);
    }
  }

  writeStatus(statusEl, result);

  // --- PATCH: state-change gate ---
  const stateChanged = result.state !== lastState;
  lastState = result.state;

  if (stateChanged) {
    dispatchActivationEvent(target, result);
  }

  return result;
}

export function receiveActivationInput(input = {}, options = {}) {
  const result = computeActivationState(input);
  return applyActivationState(result, options);
}

export function receiveTouchActivation(touch, options = {}) {
  const {
    proximity = DEFAULTS.proximity,
    maxForceN = DEFAULTS.maxForceN,
    fallbackForceN = DEFAULTS.fallbackForceN,
  } = options;

  const result = computeActivationFromTouch(touch, {
    ...options,
    proximity,
    maxForceN,
    fallbackForceN,
  });

  return applyActivationState(result, options);
}

export function bindVesselActivation(options = {}) {
  const {
    targetSelector = DEFAULTS.targetSelector,
    proximity = DEFAULTS.proximity,
  } = options;

  const target = findTarget(targetSelector);

  if (!target) {
    return {
      ok: false,
      reason: "VESSEL_TARGET_NOT_FOUND",
    };
  }

  function onTouchStart(event) {
    const touch = event.touches && event.touches[0];
    receiveTouchActivation(touch, {
      ...options,
      proximity,
    });
  }

  function onTouchMove(event) {
    const touch = event.touches && event.touches[0];
    receiveTouchActivation(touch, {
      ...options,
      proximity: Math.max(0.1, proximity * 0.75),
    });
  }

  function onTouchEnd() {
    receiveActivationInput(
      {
        forceN: 0,
        proximity: 1.0,
      },
      options
    );
  }

  target.addEventListener("touchstart", onTouchStart, { passive: true });
  target.addEventListener("touchmove", onTouchMove, { passive: true });
  target.addEventListener("touchend", onTouchEnd, { passive: true });
  target.addEventListener("touchcancel", onTouchEnd, { passive: true });

  return {
    ok: true,
    unbind() {
      target.removeEventListener("touchstart", onTouchStart);
      target.removeEventListener("touchmove", onTouchMove);
      target.removeEventListener("touchend", onTouchEnd);
      target.removeEventListener("touchcancel", onTouchEnd);
    },
  };
}

export const VesselActivationReceiver = {
  bindVesselActivation,
  receiveActivationInput,
  receiveTouchActivation,
  applyActivationState,
};
