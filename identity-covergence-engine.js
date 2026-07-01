// identity-convergence-engine.js
// CyberCrowd Mobile Physics Prototype
// Identity Convergence Engine
//
// Purpose:
// Read shaped moment packets and determine whether local vessel activity
// is converging into an identity-ready signal.
//
// Owns:
// - convergence scoring
// - signal confidence
// - packet trend reading
// - ignition consistency
// - local readiness status
// - identity-ready interpretation
//
// Does NOT own:
// - identity authority
// - login authority
// - password validation
// - server session authority
// - EAT minting
// - cookie creation
// - KV writes
// - final identity verification

const DEFAULTS = {
  minPackets: 3,
  readyScore: 0.75,
  ignitionWeight: 0.4,
  consistencyWeight: 0.25,
  energyTrendWeight: 0.2,
  freshnessWeight: 0.15,
  maxHistory: 25,
};

let convergenceHistory = [];

function nowISO() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function trimHistory(maxHistory) {
  if (convergenceHistory.length <= maxHistory) return;
  convergenceHistory = convergenceHistory.slice(
    convergenceHistory.length - maxHistory
  );
}

function extractPayload(packet) {
  if (!packet || typeof packet !== "object") return null;
  return packet.payload || packet;
}

function readEnergy(packet) {
  const payload = extractPayload(packet);
  return toNumber(
    payload && payload.E !== undefined ? payload.E : packet && packet.E,
    0
  );
}

function readState(packet) {
  const payload = extractPayload(packet);
  return toNumber(
    payload && payload.state !== undefined
      ? payload.state
      : packet && packet.state,
    0
  );
}

function readFresh(packet) {
  if (!packet || typeof packet !== "object") return false;
  return Boolean(packet.fresh);
}

function readDeltaE(packet) {
  if (!packet || typeof packet !== "object") return 0;

  if (
    packet.continuity &&
    packet.continuity.deltas &&
    packet.continuity.deltas.E !== undefined
  ) {
    return toNumber(packet.continuity.deltas.E, 0);
  }

  if (
    packet.payload &&
    packet.payload.packet &&
    packet.payload.packet.deltas &&
    packet.payload.packet.deltas.E !== undefined
  ) {
    return toNumber(packet.payload.packet.deltas.E, 0);
  }

  if (packet.payload && packet.payload.deltaE !== undefined) {
    return toNumber(packet.payload.deltaE, 0);
  }

  return 0;
}

function countIgnitions(packets) {
  return packets.filter((packet) => readState(packet) === 2).length;
}

function scoreIgnitionPresence(packets) {
  if (!packets.length) return 0;

  const ignitionCount = countIgnitions(packets);
  return clamp(ignitionCount / packets.length);
}

function scoreConsistency(packets) {
  if (packets.length < 2) return 0;

  const states = packets.map(readState);
  const ignitionCount = states.filter((state) => state === 2).length;
  const surfaceCount = states.filter((state) => state === 1).length;

  const activeCount = ignitionCount + surfaceCount;

  return clamp(activeCount / states.length);
}

function scoreEnergyTrend(packets) {
  if (packets.length < 2) return 0;

  let positiveMoves = 0;
  let comparisons = 0;

  for (let i = 1; i < packets.length; i += 1) {
    const previous = readEnergy(packets[i - 1]);
    const current = readEnergy(packets[i]);

    if (current > previous) positiveMoves += 1;
    comparisons += 1;
  }

  return comparisons ? clamp(positiveMoves / comparisons) : 0;
}

function scoreFreshness(packets) {
  if (!packets.length) return 0;

  const freshCount = packets.filter(readFresh).length;

  // Fresh should help a new convergence session start,
  // but not overpower sustained signal behavior.
  return clamp(freshCount / packets.length);
}

function classifyTrend(packets) {
  if (packets.length < 2) return "insufficient";

  const firstEnergy = readEnergy(packets[0]);
  const lastEnergy = readEnergy(packets[packets.length - 1]);

  if (lastEnergy > firstEnergy) return "rising";
  if (lastEnergy < firstEnergy) return "falling";
  return "flat";
}

function classifyConvergence(score, readyScore) {
  if (score >= readyScore) return "identity-ready";
  if (score >= readyScore * 0.66) return "warming";
  if (score > 0) return "observing";
  return "idle";
}

function buildPacketSummary(packets) {
  return {
    count: packets.length,
    ignitions: countIgnitions(packets),
    lastState: packets.length ? readState(packets[packets.length - 1]) : null,
    lastEnergy: packets.length ? readEnergy(packets[packets.length - 1]) : null,
    trend: classifyTrend(packets),
  };
}

export function evaluateIdentityConvergence(packets = [], options = {}) {
  const {
    minPackets = DEFAULTS.minPackets,
    readyScore = DEFAULTS.readyScore,
    ignitionWeight = DEFAULTS.ignitionWeight,
    consistencyWeight = DEFAULTS.consistencyWeight,
    energyTrendWeight = DEFAULTS.energyTrendWeight,
    freshnessWeight = DEFAULTS.freshnessWeight,
    maxHistory = DEFAULTS.maxHistory,
  } = options;

  const cleanPackets = Array.isArray(packets)
    ? packets.filter((packet) => packet && typeof packet === "object")
    : [];

  if (cleanPackets.length < minPackets) {
    const result = {
      ok: true,
      evaluatedAt: nowISO(),
      convergenceState: "insufficient-signal",
      identityReady: false,
      score: 0,
      confidence: 0,
      reason: "MIN_PACKETS_NOT_MET",
      packetSummary: buildPacketSummary(cleanPackets),
      authorityNote: "LOCAL_READINESS_ONLY_SERVER_AUTHORITY_REQUIRED",
    };

    convergenceHistory.push(result);
    trimHistory(maxHistory);

    return clone(result);
  }

  const ignitionScore = scoreIgnitionPresence(cleanPackets);
  const consistencyScore = scoreConsistency(cleanPackets);
  const energyTrendScore = scoreEnergyTrend(cleanPackets);
  const freshnessScore = scoreFreshness(cleanPackets);

  const score = clamp(
    ignitionScore * ignitionWeight +
      consistencyScore * consistencyWeight +
      energyTrendScore * energyTrendWeight +
      freshnessScore * freshnessWeight
  );

  const confidence = clamp(cleanPackets.length / Math.max(minPackets, 1));

  const convergenceState = classifyConvergence(score, readyScore);

  const result = {
    ok: true,
    evaluatedAt: nowISO(),

    convergenceState,
    identityReady: convergenceState === "identity-ready",

    score,
    confidence,

    scores: {
      ignition: ignitionScore,
      consistency: consistencyScore,
      energyTrend: energyTrendScore,
      freshness: freshnessScore,
    },

    weights: {
      ignition: ignitionWeight,
      consistency: consistencyWeight,
      energyTrend: energyTrendWeight,
      freshness: freshnessWeight,
    },

    packetSummary: buildPacketSummary(cleanPackets),

    authorityNote:
      convergenceState === "identity-ready"
        ? "IDENTITY_READY_SIGNAL_ONLY_SERVER_AUTHORITY_REQUIRED"
        : "LOCAL_READINESS_ONLY_SERVER_AUTHORITY_REQUIRED",
  };

  convergenceHistory.push(result);
  trimHistory(maxHistory);

  return clone(result);
}

export function evaluateFromShaper(shaper, options = {}) {
  if (!shaper || typeof shaper.peekEmitted !== "function") {
    return {
      ok: false,
      reason: "VALID_PACKET_SHAPER_REQUIRED",
    };
  }

  const emittedPackets = shaper.peekEmitted();
  return evaluateIdentityConvergence(emittedPackets, options);
}

export function getConvergenceHistory() {
  return clone(convergenceHistory);
}

export function getLastConvergence() {
  if (!convergenceHistory.length) return null;
  return clone(convergenceHistory[convergenceHistory.length - 1]);
}

export function clearConvergenceHistory() {
  convergenceHistory = [];

  return {
    ok: true,
    cleared: true,
    clearedAt: nowISO(),
  };
}

export const IdentityConvergenceEngine = {
  evaluateIdentityConvergence,
  evaluateFromShaper,
  getConvergenceHistory,
  getLastConvergence,
  clearConvergenceHistory,
};
