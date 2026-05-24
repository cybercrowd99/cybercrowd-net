/* ============================================================
   adWorm — LAYER 1 FRAME INTEGRATION
   CyberCrowd Layer 1 Broadcast Subsystem
   Purpose: bind adWorm perimeter circuit to the broadcast frame
   No styling. No animation. Logic only.
   ============================================================ */

/* ============================================================
   SLOT REGISTRY (8 POSITIONS)
   Four corners, four rails.
   ============================================================ */

export const SLOTS = {
  topLeft:    { id: "topLeft",    index: 0 },
  topRight:   { id: "topRight",   index: 1 },
  bottomRight:{ id: "bottomRight",index: 2 },
  bottomLeft: { id: "bottomLeft", index: 3 },
  topRail:    { id: "topRail",    index: 4 },
  rightRail:  { id: "rightRail",  index: 5 },
  bottomRail: { id: "bottomRail", index: 6 },
  leftRail:   { id: "leftRail",   index: 7 }
};

const SLOT_ORDER = [
  "topLeft",
  "topRail",
  "topRight",
  "rightRail",
  "bottomRight",
  "bottomRail",
  "bottomLeft",
  "leftRail"
];

/* ============================================================
   WORM STATE MACHINE
   ============================================================ */

const wormState = {
  currentIndex: 0,
  active: false,
  intervalId: null,
  speedMs: 3000, // movement clock (can be tuned)
  slots: SLOT_ORDER
};

/* ============================================================
   INITIALIZATION
   ============================================================ */

/**
 * Initialize adWorm for a given frame.
 * @param {Object} options
 * @param {function(string):void} options.onSlotChange - callback when worm moves to a new slot
 */
export function initAdWormFrame({ onSlotChange } = {}) {
  wormState.currentIndex = 0;
  wormState.active = false;

  if (typeof onSlotChange === "function") {
    wormState.onSlotChange = onSlotChange;
  } else {
    wormState.onSlotChange = (slotId) => {
      console.log("[adWorm][Frame] Worm moved to slot:", slotId);
    };
  }

  console.log("[adWorm][Frame] Initialized with slots:", wormState.slots);
}

/* ============================================================
   CONTROL: START / STOP
   ============================================================ */

export function startAdWorm() {
  if (wormState.active) return;

  wormState.active = true;
  wormState.intervalId = setInterval(() => {
    advanceWorm();
  }, wormState.speedMs);

  // Trigger initial position
  notifySlotChange();
  console.log("[adWorm][Frame] Started.");
}

export function stopAdWorm() {
  if (!wormState.active) return;

  wormState.active = false;
  if (wormState.intervalId) {
    clearInterval(wormState.intervalId);
    wormState.intervalId = null;
  }

  console.log("[adWorm][Frame] Stopped.");
}

/* ============================================================
   MOVEMENT
   ============================================================ */

function advanceWorm() {
  wormState.currentIndex =
    (wormState.currentIndex + 1) % wormState.slots.length;
  notifySlotChange();
}

function notifySlotChange() {
  const slotId = wormState.slots[wormState.currentIndex];
  wormState.onSlotChange(slotId);
}

/* ============================================================
   CONFIGURATION
   ============================================================ */

/**
 * Set worm speed in milliseconds.
 * @param {number} ms
 */
export function setAdWormSpeed(ms) {
  if (typeof ms !== "number" || ms <= 0) return;

  wormState.speedMs = ms;

  if (wormState.active) {
    stopAdWorm();
    startAdWorm();
  }

  console.log("[adWorm][Frame] Speed set to:", ms, "ms");
}

/**
 * Get current worm state snapshot.
 */
export function getAdWormState() {
  return {
    active: wormState.active,
    currentSlot: wormState.slots[wormState.currentIndex],
    speedMs: wormState.speedMs
  };
}
