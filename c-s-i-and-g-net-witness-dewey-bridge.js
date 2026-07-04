// c-s-i-and-g-net-witness-dewey-bridge.js
// CyberCrowd — NET Witness to Dewey Bridge
//
// Owns:
// - moving low-trust NET witness clusters toward Dewey Later review
// - preserving wearable / phone edge witness context as candidate material only
// - keeping witness clusters separate from identity authority
// - blocking raw device, private, health, biometric, token, session, and location material
// - creating Dewey review packets from witness context without final classification
//
// Does NOT own:
// - final Dewey classification
// - authority execution
// - identity creation
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

const CyberCrowdNetWitnessDeweyBridge = (() => {
  const ACCEPTED_CLUSTER_STATUS = "net_witness_cluster_ready_no_authority";
  const ACCEPTED_SIGNAL_STATUS = "net_witness_signal_preserved_no_authority";
  const SOURCE_LANE = "net_witness_low_trust_context";
  const TARGET_REVIEW = "dewey_later_candidate_review";

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
    configured: false,
    received: [],
    packets: [],
    queued: [],
    processed: [],
    held: [],
    rejected: []
  };

  let WitnessSignalLedger = null;
  let DeweyLater = null;

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

  function safeRequire(path) {
    if (typeof require === "undefined") {
      return null;
    }

    try {
      return require(path);
    } catch (error) {
      return null;
    }
  }

  function configure(deps = {}) {
    WitnessSignalLedger =
      deps.WitnessSignalLedger ||
      deps.witnessSignalLedger ||
      deps.witnessLedger ||
      WitnessSignalLedger ||
      safeRequire("./c-s-i-and-g-net-witness-signal-ledger.js") ||
      null;

    DeweyLater =
      deps.DeweyLater ||
      deps.deweyLater ||
      DeweyLater ||
      safeRequire("./c-s-i-and-g-dewey-later.js") ||
      null;

    state.configured = Boolean(WitnessSignalLedger || DeweyLater);

    return {
      configured: state.configured,
      has_witness_signal_ledger: Boolean(WitnessSignalLedger),
      has_dewey_later: Boolean(DeweyLater)
    };
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
      id: makeId("witnessDeweyHold"),
      held_at: now(),
      reason,
      target: clone(target),
      dewey_ready: false,
      candidate_only: true,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "held_by_net_witness_dewey_bridge"
    };

    state.held.push(record);
    return record;
  }

  function reject(target, reason) {
    const record = {
      id: makeId("witnessDeweyReject"),
      rejected_at: now(),
      reason,
      target: clone(target),
      dewey_ready: false,
      candidate_only: true,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "rejected_by_net_witness_dewey_bridge"
    };

    state.rejected.push(record);
    return record;
  }

  function containsBlockedMaterial(input) {
    const text = toText(input);

    return BLOCKED_MARKERS.some((marker) => {
      return text.includes(marker);
    });
  }

  function isWitnessSignal(input = {}) {
    return Boolean(
      input &&
      typeof input === "object" &&
      input.status === ACCEPTED_SIGNAL_STATUS &&
      input.witness_preserved === true &&
      input.authority_allowed === false &&
      input.external_call_allowed === false &&
      input.executed === false
    );
  }

  function isWitnessCluster(input = {}) {
    return Boolean(
      input &&
      typeof input === "object" &&
      input.status === ACCEPTED_CLUSTER_STATUS &&
      input.witness_preserved === true &&
      input.cluster_ready === true &&
      input.authority_allowed === false &&
      input.external_call_allowed === false &&
      input.executed === false
    );
  }

  function recordReceived(input = {}) {
    const record = {
      id: makeId("witnessDeweyReceive"),
      received_at: now(),
      input: clone(input),
      dewey_ready: false,
      candidate_only: true,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "received_by_net_witness_dewey_bridge"
    };

    state.received.push(record);
    return record;
  }

  function buildPacket(input = {}, reason = "WITNESS_CONTEXT_FOR_DEWEY_LATER") {
    if (!input || typeof input !== "object") {
      return reject(input, "INVALID_WITNESS_DEWEY_PACKET_INPUT");
    }

    if (containsBlockedMaterial(input)) {
      return hold(input, "WITNESS_DEWEY_BLOCKED_PRIVATE_SENSOR_HEALTH_OR_TOKEN_MATERIAL");
    }

    if (!isWitnessSignal(input) && !isWitnessCluster(input)) {
      return hold(input, "WITNESS_DEWEY_REQUIRES_PRESERVED_SIGNAL_OR_CLUSTER");
    }

    const packet = {
      id: makeId("witnessDeweyPacket"),
      built_at: now(),
      source_lane: SOURCE_LANE,
      target_review: TARGET_REVIEW,
      reason,
      source_id: input.id || null,
      source_status: input.status || null,
      source_adapter_ids: clone(input.adapter_ids || input.source_adapter_id || []),
      witness_context: clone(input),
      candidate_only: true,
      final_classification: false,
      dewey_ready: true,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      allowed_uses: [
        "dewey_later_candidate_context",
        "presence_review_context",
        "witness_review_context",
        "media_reference_review_context"
      ],
      blocked_uses: [
        "authority_execution",
        "identity_creation",
        "biometric_identity",
        "private_identity_exposure",
        "health_data_collection",
        "precise_location_tracking",
        "external_device_call"
      ],
      status: "witness_dewey_packet_ready_candidate_only"
    };

    state.packets.push(packet);
    return packet;
  }

  function queueForDewey(input = {}, reason = "QUEUE_WITNESS_CONTEXT_FOR_DEWEY_LATER") {
    configure();

    const received = recordReceived(input);
    const packet = buildPacket(input, reason);

    if (
      !packet ||
      typeof packet !== "object" ||
      packet.status !== "witness_dewey_packet_ready_candidate_only"
    ) {
      return hold(
        {
          received,
          packet,
          input
        },
        "WITNESS_DEWEY_PACKET_NOT_READY"
      );
    }

    if (!DeweyLater || typeof DeweyLater.queue !== "function") {
      return hold(
        {
          received,
          packet
        },
        "DEWEY_LATER_NOT_AVAILABLE_FOR_WITNESS_CONTEXT"
      );
    }

    const queued = DeweyLater.queue({
      source_lane: SOURCE_LANE,
      source_id: packet.id,
      record: packet,
      reason,
      authority_allowed: false,
      final_classification: false
    });

    const bridgeRecord = {
      id: makeId("witnessDeweyQueue"),
      queued_at: now(),
      received_id: received.id,
      packet_id: packet.id,
      queued: clone(queued),
      packet: clone(packet),
      candidate_only: true,
      final_classification: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "witness_context_queued_for_dewey_later"
    };

    state.queued.push(bridgeRecord);
    return bridgeRecord;
  }

  function processForDewey(input = {}, reason = "PROCESS_WITNESS_CONTEXT_THROUGH_DEWEY_LATER") {
    configure();

    const received = recordReceived(input);
    const packet = buildPacket(input, reason);

    if (
      !packet ||
      typeof packet !== "object" ||
      packet.status !== "witness_dewey_packet_ready_candidate_only"
    ) {
      return hold(
        {
          received,
          packet,
          input
        },
        "WITNESS_DEWEY_PACKET_NOT_READY"
      );
    }

    if (!DeweyLater || typeof DeweyLater.process !== "function") {
      return hold(
        {
          received,
          packet
        },
        "DEWEY_LATER_PROCESS_NOT_AVAILABLE_FOR_WITNESS_CONTEXT"
      );
    }

    const processed = DeweyLater.process({
      source_lane: SOURCE_LANE,
      source_id: packet.id,
      record: packet,
      reason,
      authority_allowed: false,
      final_classification: false
    });

    const bridgeRecord = {
      id: makeId("witnessDeweyProcess"),
      processed_at: now(),
      received_id: received.id,
      packet_id: packet.id,
      processed: clone(processed),
      packet: clone(packet),
      candidate_only: true,
      final_classification: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "witness_context_processed_for_dewey_later"
    };

    state.processed.push(bridgeRecord);
    return bridgeRecord;
  }

  function clusterRecentAndQueue(limit = 10) {
    configure();

    if (
      !WitnessSignalLedger ||
      typeof WitnessSignalLedger.clusterRecent !== "function"
    ) {
      return hold(null, "WITNESS_SIGNAL_LEDGER_CLUSTER_NOT_AVAILABLE");
    }

    const cluster = WitnessSignalLedger.clusterRecent(limit);

    if (!isWitnessCluster(cluster)) {
      return hold(cluster, "RECENT_WITNESS_CLUSTER_NOT_READY_FOR_DEWEY");
    }

    return queueForDewey(cluster, "RECENT_WITNESS_CLUSTER_QUEUED_FOR_DEWEY");
  }

  function clusterRecentAndProcess(limit = 10) {
    configure();

    if (
      !WitnessSignalLedger ||
      typeof WitnessSignalLedger.clusterRecent !== "function"
    ) {
      return hold(null, "WITNESS_SIGNAL_LEDGER_CLUSTER_NOT_AVAILABLE");
    }

    const cluster = WitnessSignalLedger.clusterRecent(limit);

    if (!isWitnessCluster(cluster)) {
      return hold(cluster, "RECENT_WITNESS_CLUSTER_NOT_READY_FOR_DEWEY");
    }

    return processForDewey(cluster, "RECENT_WITNESS_CLUSTER_PROCESSED_FOR_DEWEY");
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
    SOURCE_LANE,
    TARGET_REVIEW,
    configure,
    buildPacket,
    queueForDewey,
    processForDewey,
    clusterRecentAndQueue,
    clusterRecentAndProcess,
    isWitnessSignal,
    isWitnessCluster,
    containsBlockedMaterial,
    canBecomeAuthority,
    canCallExternal,
    hold,
    reject,
    getState
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCrowdNetWitnessDeweyBridge;
}
