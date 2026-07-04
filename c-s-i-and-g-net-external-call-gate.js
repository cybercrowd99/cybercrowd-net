// c-s-i-and-g-net-external-call-gate.js
// CyberCrowd — NET External Call Gate
//
// Owns:
// - reviewing NET adapter shelf assignments before any future external provider call
// - blocking 000, private, token, session, health, biometric, raw sensor, and precise location material
// - creating external-call permission tickets only after NET shelf readiness
// - separating permission ticket creation from actual provider execution
// - preserving a local audit trail for future provider adapters
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

const CyberCrowdNetExternalCallGate = (() => {
  const ACCEPTED_ASSIGNMENT_STATUS = "assigned_to_net_adapter_shelf_no_external_call";
  const LANE_000 = "000_future_sci_fi_unclassified";

  const ALLOWED_PURPOSES = [
    "provider_delivery",
    "provider_status_check",
    "provider_sync_prepare",
    "provider_message_prepare",
    "provider_receipt_prepare",
    "provider_signal_prepare"
  ];

  const BLOCKED_MARKERS = [
    LANE_000,
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
    reviewed: [],
    tickets: [],
    held: [],
    rejected: []
  };

  let NetAdapterShelf = null;

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
    NetAdapterShelf =
      deps.NetAdapterShelf ||
      deps.netAdapterShelf ||
      deps.adapterShelf ||
      NetAdapterShelf ||
      safeRequire("./c-s-i-and-g-net-adapter-shelf.js") ||
      null;

    state.configured = Boolean(NetAdapterShelf);

    return {
      configured: state.configured,
      has_net_adapter_shelf: Boolean(NetAdapterShelf)
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
      id: makeId("externalCallGateHold"),
      held_at: now(),
      reason,
      target: clone(target),
      external_call_allowed: false,
      provider_call_executed: false,
      authority_allowed: false,
      executed: false,
      status: "held_by_net_external_call_gate"
    };

    state.held.push(record);
    return record;
  }

  function reject(target, reason) {
    const record = {
      id: makeId("externalCallGateReject"),
      rejected_at: now(),
      reason,
      target: clone(target),
      external_call_allowed: false,
      provider_call_executed: false,
      authority_allowed: false,
      executed: false,
      status: "rejected_by_net_external_call_gate"
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

  function isShelfAssignment(input = {}) {
    if (!input || typeof input !== "object") {
      return false;
    }

    return (
      input.status === ACCEPTED_ASSIGNMENT_STATUS &&
      input.adapter_ready === true &&
      input.net_ready === true &&
      input.authority_allowed === true &&
      input.release_allowed === true &&
      input.certificate_valid === true &&
      input.external_call_allowed === false &&
      input.executed === false
    );
  }

  function shelfAllowsAssignment(input = {}) {
    configure();

    if (
      NetAdapterShelf &&
      typeof NetAdapterShelf.canExternalCall === "function"
    ) {
      return NetAdapterShelf.canExternalCall(input);
    }

    return isShelfAssignment(input);
  }

  function normalizePurpose(value) {
    const purpose = String(value || "").trim().toLowerCase();

    if (!purpose) {
      return null;
    }

    return purpose
      .replace(/[^a-z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function isAllowedPurpose(purpose) {
    return ALLOWED_PURPOSES.includes(normalizePurpose(purpose));
  }

  function review(input = {}, options = {}) {
    configure(options.deps || {});

    const provider = cleanProvider(
      options.provider ||
      input.provider ||
      input.target_provider ||
      input.adapter_id
    );

    const purpose = normalizePurpose(
      options.purpose ||
      input.purpose ||
      "provider_delivery"
    );

    const reviewRecord = {
      id: makeId("externalCallReview"),
      reviewed_at: now(),
      provider,
      purpose,
      input: clone(input),
      external_call_allowed: false,
      provider_call_executed: false,
      authority_allowed: false,
      executed: false,
      status: "net_external_call_review_started"
    };

    state.reviewed.push(reviewRecord);

    if (!input || typeof input !== "object") {
      return reject(
        {
          reviewRecord,
          input
        },
        "INVALID_EXTERNAL_CALL_GATE_INPUT"
      );
    }

    if (!provider) {
      return hold(
        {
          reviewRecord,
          input
        },
        "TARGET_PROVIDER_REQUIRED"
      );
    }

    if (!isAllowedPurpose(purpose)) {
      return hold(
        {
          reviewRecord,
          input,
          purpose,
          allowed_purposes: clone(ALLOWED_PURPOSES)
        },
        "EXTERNAL_CALL_PURPOSE_NOT_ALLOWED"
      );
    }

    if (containsBlockedMaterial(input)) {
      return hold(
        {
          reviewRecord,
          input
        },
        "EXTERNAL_CALL_BLOCKED_SENSITIVE_OR_000_MATERIAL"
      );
    }

    if (!isShelfAssignment(input)) {
      return hold(
        {
          reviewRecord,
          input
        },
        "EXTERNAL_CALL_REQUIRES_NET_ADAPTER_SHELF_ASSIGNMENT"
      );
    }

    if (!shelfAllowsAssignment(input)) {
      return hold(
        {
          reviewRecord,
          input
        },
        "NET_ADAPTER_SHELF_DID_NOT_APPROVE_ASSIGNMENT_FOR_CALL_GATE"
      );
    }

    const ticket = {
      id: makeId("externalCallTicket"),
      issued_at: now(),
      provider,
      purpose,
      source_assignment_id: input.id || null,
      source_adapter_id: input.adapter_id || null,
      source_adapter_kind: input.adapter_kind || null,
      assignment: clone(input),
      requirements: [
        "provider_adapter_must_exist",
        "provider_adapter_must_validate_ticket",
        "provider_credentials_must_be_supplied_by_provider_layer",
        "provider_layer_must_execute_separately",
        "provider_layer_must_record_result"
      ],
      allowed_uses: [
        "future_provider_adapter_intake",
        "future_provider_call_prepare",
        "future_provider_delivery_review"
      ],
      blocked_uses: [
        "direct_api_call_from_gate",
        "oauth_from_gate",
        "credential_storage_from_gate",
        "scraping_from_gate",
        "payment_from_gate",
        "authority_execution_from_gate",
        "real_world_execution_from_gate"
      ],
      external_call_allowed: true,
      provider_call_executed: false,
      authority_allowed: true,
      release_allowed: true,
      certificate_valid: true,
      executed: false,
      status: "net_external_call_ticket_ready_no_execution"
    };

    state.tickets.push(ticket);
    return ticket;
  }

  function validateTicket(ticket = {}) {
    if (!ticket || typeof ticket !== "object") {
      return {
        valid: false,
        reason: "INVALID_EXTERNAL_CALL_TICKET"
      };
    }

    if (containsBlockedMaterial(ticket)) {
      return {
        valid: false,
        reason: "EXTERNAL_CALL_TICKET_CONTAINS_BLOCKED_MATERIAL"
      };
    }

    const valid = (
      ticket.status === "net_external_call_ticket_ready_no_execution" &&
      ticket.external_call_allowed === true &&
      ticket.provider_call_executed === false &&
      ticket.authority_allowed === true &&
      ticket.release_allowed === true &&
      ticket.certificate_valid === true &&
      ticket.executed === false &&
      Boolean(ticket.provider) &&
      isAllowedPurpose(ticket.purpose)
    );

    return {
      valid,
      reason: valid
        ? "EXTERNAL_CALL_TICKET_VALID"
        : "EXTERNAL_CALL_TICKET_INVALID"
    };
  }

  function canProviderAdapterReceive(ticket = {}) {
    const validation = validateTicket(ticket);

    return Boolean(validation.valid);
  }

  function canExecuteExternalCallHere() {
    return false;
  }

  function canExecuteAuthority() {
    return false;
  }

  function getState() {
    return clone(state);
  }

  return {
    ALLOWED_PURPOSES,
    configure,
    review,
    validateTicket,
    canProviderAdapterReceive,
    canExecuteExternalCallHere,
    canExecuteAuthority,
    containsBlockedMaterial,
    isShelfAssignment,
    shelfAllowsAssignment,
    isAllowedPurpose,
    hold,
    reject,
    getState
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCrowdNetExternalCallGate;
}
