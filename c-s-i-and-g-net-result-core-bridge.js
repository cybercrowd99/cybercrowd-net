// c-s-i-and-g-net-result-core-bridge.js
// CyberCrowd — NET Result to Core Bridge
//
// Owns:
// - moving verified NET provider results back toward Core review
// - converting provider outcomes into evidence-candidate packets
// - keeping provider activity separate from identity authority
// - blocking sensitive, private, token, session, health, biometric, raw sensor, location, and 000 material
// - preserving a return trail from NET result ledger to Core evidence review
//
// Does NOT own:
// - authority execution
// - identity creation
// - final Dewey classification
// - provider-specific adapters
// - OAuth
// - credential storage
// - external API calls
// - webhook delivery
// - scraping
// - payment
// - sessions
// - cookies
// - KV storage
// - UI
// - real-world execution

const CyberCrowdNetResultCoreBridge = (() => {
  const ACCEPTED_RESULT_STATUS = "provider_result_verified_no_authority";
  const CORE_EVIDENCE_LANE = "evidence_lane";
  const SOURCE_LANE = "net_provider_result_context";

  const BLOCKED_MARKERS = [
    "000_future_sci_fi_unclassified",
    "null horizon",
    "preserved_in_000",
    "unclassified_signal_routed_to_000",
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
    "access_token",
    "refresh_token",
    "authorization",
    "bearer",
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
    queuedForCore: [],
    held: [],
    rejected: []
  };

  let ProviderResultLedger = null;

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
    ProviderResultLedger =
      deps.ProviderResultLedger ||
      deps.providerResultLedger ||
      deps.resultLedger ||
      ProviderResultLedger ||
      safeRequire("./c-s-i-and-g-net-provider-result-ledger.js") ||
      null;

    state.configured = Boolean(ProviderResultLedger);

    return {
      configured: state.configured,
      has_provider_result_ledger: Boolean(ProviderResultLedger)
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
      id: makeId("netResultCoreHold"),
      held_at: now(),
      reason,
      target: clone(target),
      core_ready: false,
      evidence_candidate: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "held_by_net_result_core_bridge"
    };

    state.held.push(record);
    return record;
  }

  function reject(target, reason) {
    const record = {
      id: makeId("netResultCoreReject"),
      rejected_at: now(),
      reason,
      target: clone(target),
      core_ready: false,
      evidence_candidate: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "rejected_by_net_result_core_bridge"
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

  function isVerifiedProviderResult(input = {}) {
    if (!input || typeof input !== "object") {
      return false;
    }

    if (
      ProviderResultLedger &&
      typeof ProviderResultLedger.canReturnToCoreReview === "function"
    ) {
      return ProviderResultLedger.canReturnToCoreReview(input);
    }

    return (
      input.status === ACCEPTED_RESULT_STATUS &&
      input.result_recorded === true &&
      input.result_verified === true &&
      input.authority_allowed === false &&
      input.external_call_allowed === false &&
      input.executed === false
    );
  }

  function recordReceived(input = {}) {
    const record = {
      id: makeId("netResultCoreReceive"),
      received_at: now(),
      input: clone(input),
      core_ready: false,
      evidence_candidate: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "received_by_net_result_core_bridge"
    };

    state.received.push(record);
    return record;
  }

  function buildEvidenceCandidate(resultRecord = {}, reason = "NET_PROVIDER_RESULT_TO_CORE_EVIDENCE") {
    configure();

    if (!resultRecord || typeof resultRecord !== "object") {
      return reject(resultRecord, "INVALID_NET_RESULT_FOR_CORE_PACKET");
    }

    if (containsBlockedMaterial(resultRecord)) {
      return hold(resultRecord, "NET_RESULT_CORE_BLOCKED_SENSITIVE_OR_000_MATERIAL");
    }

    if (!isVerifiedProviderResult(resultRecord)) {
      return hold(resultRecord, "NET_RESULT_CORE_REQUIRES_VERIFIED_PROVIDER_RESULT");
    }

    const packet = {
      id: makeId("netEvidenceCandidate"),
      built_at: now(),
      source_lane: SOURCE_LANE,
      target_lane: CORE_EVIDENCE_LANE,
      reason,
      provider: resultRecord.provider || null,
      outcome: resultRecord.outcome || null,
      provider_result_id: resultRecord.id || null,
      provider_message_id: resultRecord.provider_message_id || null,
      provider_reference: resultRecord.provider_reference || null,
      source_pull_id: resultRecord.source_pull_id || null,
      source_queue_id: resultRecord.source_queue_id || null,
      source_envelope_id: resultRecord.source_envelope_id || null,
      result_summary: clone(resultRecord.result_summary || {}),
      safe_meta: clone(resultRecord.safe_meta || {}),
      provider_result: clone(resultRecord),
      lanes: [
        CORE_EVIDENCE_LANE
      ],
      attrs: {
        evidence_pressure: 1,
        movement_pressure: 0,
        identity_pressure: 0,
        authority_pressure: 0,
        unknown_pressure: 0,
        source_count: 1,
        provider_result_depth: true,
        evidence_depth: true
      },
      allowed_uses: [
        "core_evidence_review",
        "provider_receipt_review",
        "dewey_later_candidate_context",
        "pressure_ledger_context"
      ],
      blocked_uses: [
        "authority_execution",
        "identity_creation",
        "private_identity_exposure",
        "credential_storage",
        "oauth",
        "external_api_call_from_bridge",
        "payment_from_bridge",
        "real_world_execution_from_bridge"
      ],
      core_ready: true,
      evidence_candidate: true,
      final_classification: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "net_result_core_evidence_candidate_ready"
    };

    state.packets.push(packet);
    return packet;
  }

  function queueForCore(resultRecord = {}, reason = "QUEUE_NET_RESULT_FOR_CORE_EVIDENCE_REVIEW") {
    const received = recordReceived(resultRecord);
    const packet = buildEvidenceCandidate(resultRecord, reason);

    if (
      !packet ||
      typeof packet !== "object" ||
      packet.status !== "net_result_core_evidence_candidate_ready"
    ) {
      return hold(
        {
          received,
          packet,
          resultRecord
        },
        "NET_RESULT_CORE_PACKET_NOT_READY"
      );
    }

    const queued = {
      id: makeId("netResultCoreQueue"),
      queued_at: now(),
      received_id: received.id,
      packet_id: packet.id,
      packet: clone(packet),
      target_lane: CORE_EVIDENCE_LANE,
      source_lane: SOURCE_LANE,
      core_ready: true,
      evidence_candidate: true,
      final_classification: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "net_result_queued_for_core_evidence_review"
    };

    state.queuedForCore.push(queued);
    return queued;
  }

  function receiveFromResultLedger(reportOrResult = {}, options = {}) {
    configure(options.deps || {});

    if (isVerifiedProviderResult(reportOrResult)) {
      return queueForCore(
        reportOrResult,
        options.reason || "VERIFIED_PROVIDER_RESULT_RETURNED_TO_CORE"
      );
    }

    if (
      !ProviderResultLedger ||
      typeof ProviderResultLedger.recordResult !== "function"
    ) {
      return hold(reportOrResult, "PROVIDER_RESULT_LEDGER_NOT_AVAILABLE");
    }

    const recorded = ProviderResultLedger.recordResult(reportOrResult);

    if (
      !ProviderResultLedger ||
      typeof ProviderResultLedger.verifyResult !== "function"
    ) {
      return hold(
        {
          reportOrResult,
          recorded
        },
        "PROVIDER_RESULT_VERIFY_NOT_AVAILABLE"
      );
    }

    const verified = ProviderResultLedger.verifyResult(recorded);

    if (!isVerifiedProviderResult(verified)) {
      return hold(
        {
          reportOrResult,
          recorded,
          verified
        },
        "PROVIDER_RESULT_DID_NOT_VERIFY_FOR_CORE_RETURN"
      );
    }

    return queueForCore(
      verified,
      options.reason || "RECORDED_PROVIDER_RESULT_RETURNED_TO_CORE"
    );
  }

  function pullNextCorePacket() {
    const next = state.queuedForCore.shift();

    if (!next) {
      return null;
    }

    return clone(next);
  }

  function peekCoreQueue() {
    return clone(state.queuedForCore);
  }

  function canEnterCoreReview(record = {}) {
    return Boolean(
      record &&
      typeof record === "object" &&
      record.status === "net_result_queued_for_core_evidence_review" &&
      record.core_ready === true &&
      record.evidence_candidate === true &&
      record.authority_allowed === false &&
      record.external_call_allowed === false &&
      record.executed === false
    );
  }

  function canExecuteAuthority() {
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
    CORE_EVIDENCE_LANE,
    configure,
    buildEvidenceCandidate,
    queueForCore,
    receiveFromResultLedger,
    pullNextCorePacket,
    peekCoreQueue,
    containsBlockedMaterial,
    isVerifiedProviderResult,
    canEnterCoreReview,
    canExecuteAuthority,
    canCallExternal,
    hold,
    reject,
    getState
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCrowdNetResultCoreBridge;
}
