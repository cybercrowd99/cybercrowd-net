// c-s-i-and-g-net-witness-signal-ledger.js
// CyberCrowd — NET Witness Signal Ledger
//
// Owns:
// - receiving preserved low-trust signals from NET adapters
// - accepting Smart Ring presence / gesture / witness hints
// - accepting Phone Edge presence / heartbeat / witness / media reference hints
// - preserving adapter witness trails without granting authority
// - grouping low-trust witness hints into observation clusters
// - keeping witness signals separate from identity authority
//
// Does NOT own:
// - raw device APIs
// - camera activation
// - microphone activation
// - GPS / precise location collection
// - biometric identity creation
// - OAuth
// - external API calls
// - scraping
// - webhook delivery
// - payment
// - sessions
// - cookies
// - KV storage
// - UI
// - real-world execution
// - authority execution

const CyberCrowdNetWitnessSignalLedger = (() => {
  const ACCEPTED_SMART_RING_STATUS = "smart_ring_signal_preserved_no_external_call";
  const ACCEPTED_PHONE_EDGE_STATUS = "phone_edge_signal_preserved_no_external_call";

  const BLOCKED_MARKERS = [
    "private_id",
    "private id",
    "private_identity",
    "private identity",
    "protected_identity",
    "protected identity",
    "internal_identity",
    "internal identity",
    "secret",
    "password",
    "token",
    "session",
    "cookie",
    "kv",
    "heart rate",
    "blood oxygen",
    "spo2",
    "sleep",
    "medical",
    "health",
    "biometric",
    "fingerprint",
    "face id",
    "dna",
    "gps",
    "precise location",
    "exact location",
    "latitude",
    "longitude",
    "raw_camera",
    "raw camera",
    "raw_microphone",
    "raw microphone",
    "camera stream",
    "microphone stream"
  ];

  const state = {
    received: [],
    preserved: [],
    clusters: [],
    held: [],
    rejected: []
  };

  function now() {
    return new Date().toISOString();
  }

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return String(value);
    }
  }

  function makeId(prefix) {
    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }

  function toText(value) {
    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "string") {
      return value.toLowerCase();
    }

    try {
      return JSON.stringify(value).toLowerCase();
    } catch (error) {
      return String(value).toLowerCase();
    }
  }

  function hold(target, reason) {
    const record = {
      id: makeId("witnessLedgerHold"),
      held_at: now(),
      reason,
      target: clone(target),
      witness_preserved: false,
      cluster_ready: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "held_by_net_witness_signal_ledger"
    };

    state.held.push(record);
    return record;
  }

  function reject(target, reason) {
    const record = {
      id: makeId("witnessLedgerReject"),
      rejected_at: now(),
      reason,
      target: clone(target),
      witness_preserved: false,
      cluster_ready: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "rejected_by_net_witness_signal_ledger"
    };

    state.rejected.push(record);
    return record;
  }

  function containsBlockedMaterial(input) {
    const text = toText(input);
    return BLOCKED_MARKERS.some((marker) => text.includes(marker));
  }

  function recordReceived(input = {}) {
    const record = {
      id: makeId("witnessLedgerReceive"),
      received_at: now(),
      input: clone(input),
      witness_preserved: false,
      cluster_ready: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "received_by_net_witness_signal_ledger"
    };

    state.received.push(record);
    return record;
  }

  function isSmartRingSignal(input = {}) {
    return Boolean(
      input &&
      typeof input === "object" &&
      input.status === ACCEPTED_SMART_RING_STATUS &&
      input.adapter_id === "smart_ring_adapter" &&
      input.device_signal_preserved === true &&
      input.external_call_allowed === false &&
      input.authority_allowed === false &&
      input.executed === false
    );
  }

  function isPhoneEdgeSignal(input = {}) {
    return Boolean(
      input &&
      typeof input === "object" &&
      input.status === ACCEPTED_PHONE_EDGE_STATUS &&
      input.adapter_id === "phone_edge_adapter" &&
      input.phone_signal_preserved === true &&
      input.external_call_allowed === false &&
      input.authority_allowed === false &&
      input.executed === false
    );
  }

  function detectSignalKind(input = {}) {
    if (isSmartRingSignal(input)) {
      return "smart_ring_witness_hint";
    }

    if (isPhoneEdgeSignal(input)) {
      return "phone_edge_witness_hint";
    }

    return "unknown_witness_hint";
  }

  function validate(input = {}) {
    if (!input || typeof input !== "object") {
      return {
        valid: false,
        reason: "INVALID_WITNESS_SIGNAL_INPUT"
      };
    }

    if (containsBlockedMaterial(input)) {
      return {
        valid: false,
        reason: "WITNESS_SIGNAL_BLOCKED_PRIVATE_SENSOR_HEALTH_OR_TOKEN_MATERIAL"
      };
    }

    if (isSmartRingSignal(input)) {
      return {
        valid: true,
        reason: "SMART_RING_WITNESS_SIGNAL_ACCEPTED"
      };
    }

    if (isPhoneEdgeSignal(input)) {
      return {
        valid: true,
        reason: "PHONE_EDGE_WITNESS_SIGNAL_ACCEPTED"
      };
    }

    return {
      valid: false,
      reason: "UNRECOGNIZED_WITNESS_SIGNAL_SOURCE"
    };
  }

  function preserve(input = {}, receivedRecord = null) {
    const signalKind = detectSignalKind(input);

    const preserved = {
      id: makeId("witnessSignal"),
      preserved_at: now(),
      received_id: receivedRecord && receivedRecord.id || null,
      source_adapter_id: input.adapter_id || null,
      source_signal_id: input.id || null,
      signal_kind: signalKind,
      signal: clone(input),
      allowed_uses: [
        "low_trust_presence_context",
        "low_trust_gesture_context",
        "low_trust_witness_context",
        "low_trust_media_reference_context"
      ],
      blocked_uses: [
        "identity_creation",
        "biometric_identity",
        "private_identity_exposure",
        "health_data_collection",
        "precise_location_tracking",
        "authority_execution",
        "external_device_call"
      ],
      trust_level: "low_trust_observation_only",
      witness_preserved: true,
      cluster_ready: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "net_witness_signal_preserved_no_authority"
    };

    state.preserved.push(preserved);
    return preserved;
  }

  function receive(input = {}) {
    const receivedRecord = recordReceived(input);
    const validation = validate(input);

    if (!validation.valid) {
      return hold(
        {
          receivedRecord,
          validation,
          input
        },
        validation.reason
      );
    }

    return preserve(input, receivedRecord);
  }

  function buildCluster(signals = [], reason = "WITNESS_CLUSTER_CREATED") {
    const cleanSignals = Array.isArray(signals)
      ? signals.filter((signal) => {
          return (
            signal &&
            typeof signal === "object" &&
            signal.status === "net_witness_signal_preserved_no_authority" &&
            signal.witness_preserved === true &&
            signal.authority_allowed === false &&
            signal.external_call_allowed === false &&
            signal.executed === false
          );
        })
      : [];

    if (cleanSignals.length === 0) {
      return hold(
        {
          signals
        },
        "NO_VALID_WITNESS_SIGNALS_FOR_CLUSTER"
      );
    }

    const adapterIds = Array.from(new Set(
      cleanSignals
        .map((signal) => signal.source_adapter_id)
        .filter(Boolean)
    ));

    const cluster = {
      id: makeId("witnessCluster"),
      clustered_at: now(),
      reason,
      adapter_ids: adapterIds,
      signal_count: cleanSignals.length,
      signals: clone(cleanSignals),
      corroboration_level: adapterIds.length > 1
        ? "multi_adapter_low_trust_context"
        : "single_adapter_low_trust_context",
      allowed_uses: [
        "context_review",
        "presence_review",
        "witness_review",
        "dewey_later_candidate_context"
      ],
      blocked_uses: [
        "authority_execution",
        "identity_creation",
        "biometric_identity",
        "private_identity_exposure",
        "external_device_call"
      ],
      trust_level: "low_trust_observation_only",
      witness_preserved: true,
      cluster_ready: true,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "net_witness_cluster_ready_no_authority"
    };

    state.clusters.push(cluster);
    return cluster;
  }

  function clusterRecent(limit = 10) {
    const count = Number.isFinite(limit) && limit > 0 ? limit : 10;
    const signals = state.preserved.slice(-count);
    return buildCluster(signals, "RECENT_WITNESS_SIGNALS_CLUSTERED");
  }

  function canBecomeAuthority() {
    return false;
  }

  function canCallExternal() {
    return false;
  }

  function getState() {
    return clone(state);
  }

  return {
    receive,
    preserve,
    validate,
    buildCluster,
    clusterRecent,
    isSmartRingSignal,
    isPhoneEdgeSignal,
    detectSignalKind,
    containsBlockedMaterial,
    canBecomeAuthority,
    canCallExternal,
    hold,
    reject,
    getState
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCrowdNetWitnessSignalLedger;
}
