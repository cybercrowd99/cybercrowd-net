// c-s-i-and-g-net-provider-result-ledger.js
// CyberCrowd — NET Provider Result Ledger
//
// Owns:
// - receiving future provider adapter result reports
// - preserving provider attempt trails after a provider adapter acts
// - separating provider result evidence from authority execution
// - validating provider result records before they can return to Core review
// - blocking sensitive, private, token, session, health, biometric, raw sensor, and 000 material
//
// Does NOT own:
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
// - authority execution

const CyberCrowdNetProviderResultLedger = (() => {
  const ACCEPTED_PULL_STATUS = "provider_envelope_pulled_no_execution";

  const RESULT_STATUS = {
    REPORTED: "provider_result_reported",
    RECORDED: "provider_result_recorded_no_authority",
    HELD: "provider_result_held",
    REJECTED: "provider_result_rejected"
  };

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
    recorded: [],
    held: [],
    rejected: []
  };

  let ProviderQueue = null;

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
    ProviderQueue =
      deps.ProviderQueue ||
      deps.providerQueue ||
      ProviderQueue ||
      safeRequire("./c-s-i-and-g-net-provider-queue.js") ||
      null;

    state.configured = Boolean(ProviderQueue);

    return {
      configured: state.configured,
      has_provider_queue: Boolean(ProviderQueue)
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

  function cleanProvider(value) {
    const clean = String(value || "").trim();

    if (!clean) {
      return null;
    }

    return clean
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function hold(target, reason) {
    const record = {
      id: makeId("providerResultHold"),
      held_at: now(),
      reason,
      target: clone(target),
      result_recorded: false,
      result_verified: false,
      provider_call_executed: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "held_by_net_provider_result_ledger"
    };

    state.held.push(record);
    return record;
  }

  function reject(target, reason) {
    const record = {
      id: makeId("providerResultReject"),
      rejected_at: now(),
      reason,
      target: clone(target),
      result_recorded: false,
      result_verified: false,
      provider_call_executed: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "rejected_by_net_provider_result_ledger"
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

  function isProviderPullRecord(input = {}) {
    if (!input || typeof input !== "object") {
      return false;
    }

    if (
      ProviderQueue &&
      typeof ProviderQueue.canProviderAdapterPull === "function"
    ) {
      return ProviderQueue.canProviderAdapterPull(input);
    }

    return (
      input.status === ACCEPTED_PULL_STATUS &&
      input.provider_ready === true &&
      input.external_call_allowed === true &&
      input.provider_call_executed === false &&
      input.authority_allowed === true &&
      input.release_allowed === true &&
      input.certificate_valid === true &&
      input.executed === false &&
      Boolean(input.provider)
    );
  }

  function normalizeOutcome(value) {
    const outcome = String(value || "").trim().toLowerCase();

    if (
      outcome === "success" ||
      outcome === "sent" ||
      outcome === "delivered" ||
      outcome === "accepted"
    ) {
      return "provider_success_reported";
    }

    if (
      outcome === "fail" ||
      outcome === "failed" ||
      outcome === "error" ||
      outcome === "rejected"
    ) {
      return "provider_failure_reported";
    }

    if (
      outcome === "skipped" ||
      outcome === "held" ||
      outcome === "blocked"
    ) {
      return "provider_no_send_reported";
    }

    return "provider_unknown_result_reported";
  }

  function receive(input = {}) {
    const received = {
      id: makeId("providerResultReceive"),
      received_at: now(),
      input: clone(input),
      result_recorded: false,
      result_verified: false,
      provider_call_executed: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "received_by_net_provider_result_ledger"
    };

    state.received.push(received);
    return received;
  }

  function validateReport(report = {}) {
    configure();

    if (!report || typeof report !== "object") {
      return {
        valid: false,
        reason: "INVALID_PROVIDER_RESULT_REPORT"
      };
    }

    if (containsBlockedMaterial(report)) {
      return {
        valid: false,
        reason: "PROVIDER_RESULT_BLOCKED_SENSITIVE_OR_000_MATERIAL"
      };
    }

    if (!report.provider && !(report.pull_record && report.pull_record.provider)) {
      return {
        valid: false,
        reason: "PROVIDER_RESULT_REQUIRES_PROVIDER"
      };
    }

    if (!report.pull_record || !isProviderPullRecord(report.pull_record)) {
      return {
        valid: false,
        reason: "PROVIDER_RESULT_REQUIRES_PROVIDER_QUEUE_PULL_RECORD"
      };
    }

    return {
      valid: true,
      reason: "PROVIDER_RESULT_REPORT_VALID"
    };
  }

  function recordResult(report = {}) {
    const received = receive(report);
    const validation = validateReport(report);

    if (!validation.valid) {
      return hold(
        {
          received,
          validation,
          report
        },
        validation.reason
      );
    }

    const provider = cleanProvider(report.provider || report.pull_record.provider);
    const outcome = normalizeOutcome(report.outcome || report.result || report.status_code || "unknown");

    const resultRecord = {
      id: makeId("providerResult"),
      recorded_at: now(),
      provider,
      outcome,
      provider_message_id: report.provider_message_id || null,
      provider_reference: report.provider_reference || null,
      source_pull_id: report.pull_record.id || null,
      source_queue_id:
        report.pull_record.queued_record &&
        report.pull_record.queued_record.id ||
        null,
      source_envelope_id:
        report.pull_record.queued_record &&
        report.pull_record.queued_record.source_envelope_id ||
        null,
      pull_record: clone(report.pull_record),
      result_summary: clone(report.result_summary || {}),
      safe_meta: clone(report.safe_meta || {}),
      result_recorded: true,
      result_verified: false,
      provider_call_executed: report.provider_call_executed === true,
      external_call_allowed: false,
      authority_allowed: false,
      executed: false,
      allowed_uses: [
        "provider_result_review",
        "provider_receipt_review",
        "dewey_later_candidate_context",
        "core_evidence_candidate_context"
      ],
      blocked_uses: [
        "authority_execution",
        "identity_creation",
        "credential_storage",
        "oauth",
        "external_api_call_from_ledger",
        "payment_from_ledger",
        "real_world_execution_from_ledger"
      ],
      status: RESULT_STATUS.RECORDED
    };

    state.recorded.push(resultRecord);
    return resultRecord;
  }

  function verifyResult(resultRecord = {}) {
    if (
      !resultRecord ||
      typeof resultRecord !== "object" ||
      resultRecord.status !== RESULT_STATUS.RECORDED
    ) {
      return hold(resultRecord, "INVALID_PROVIDER_RESULT_FOR_VERIFY");
    }

    if (containsBlockedMaterial(resultRecord)) {
      return hold(resultRecord, "PROVIDER_RESULT_VERIFY_BLOCKED_SENSITIVE_OR_000_MATERIAL");
    }

    const verified = {
      ...clone(resultRecord),
      verified_at: now(),
      result_verified: true,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "provider_result_verified_no_authority"
    };

    state.recorded.push(verified);
    return verified;
  }

  function canReturnToCoreReview(resultRecord = {}) {
    return Boolean(
      resultRecord &&
      typeof resultRecord === "object" &&
      resultRecord.status === "provider_result_verified_no_authority" &&
      resultRecord.result_recorded === true &&
      resultRecord.result_verified === true &&
      resultRecord.authority_allowed === false &&
      resultRecord.external_call_allowed === false &&
      resultRecord.executed === false
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
    RESULT_STATUS,
    configure,
    recordResult,
    verifyResult,
    validateReport,
    receive,
    isProviderPullRecord,
    containsBlockedMaterial,
    normalizeOutcome,
    canReturnToCoreReview,
    canExecuteAuthority,
    canCallExternal,
    hold,
    reject,
    getState
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCrowdNetProviderResultLedger;
      }
