// c-s-i-and-g-net-provider-queue.js
// CyberCrowd — NET Provider Queue
//
// Owns:
// - receiving provider-ready envelopes from the NET Provider Adapter Contract
// - sorting provider envelopes into provider-specific queues
// - holding provider-ready material until a real provider adapter exists
// - allowing later provider-specific adapters to pull clean envelopes
// - preserving queue trail without OAuth, credentials, or external calls
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

const CyberCrowdNetProviderQueue = (() => {
  const ACCEPTED_ENVELOPE_STATUS = "provider_adapter_envelope_ready_no_execution";

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
    queued: [],
    pulled: [],
    providerQueues: Object.create(null),
    held: [],
    rejected: []
  };

  let ProviderAdapterContract = null;

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
    ProviderAdapterContract =
      deps.ProviderAdapterContract ||
      deps.providerAdapterContract ||
      deps.providerContract ||
      ProviderAdapterContract ||
      safeRequire("./c-s-i-and-g-net-provider-adapter-contract.js") ||
      null;

    state.configured = Boolean(ProviderAdapterContract);

    return {
      configured: state.configured,
      has_provider_adapter_contract: Boolean(ProviderAdapterContract)
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
      id: makeId("providerQueueHold"),
      held_at: now(),
      reason,
      target: clone(target),
      queued: false,
      provider_ready: false,
      external_call_allowed: false,
      provider_call_executed: false,
      authority_allowed: false,
      executed: false,
      status: "held_by_net_provider_queue"
    };

    state.held.push(record);
    return record;
  }

  function reject(target, reason) {
    const record = {
      id: makeId("providerQueueReject"),
      rejected_at: now(),
      reason,
      target: clone(target),
      queued: false,
      provider_ready: false,
      external_call_allowed: false,
      provider_call_executed: false,
      authority_allowed: false,
      executed: false,
      status: "rejected_by_net_provider_queue"
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

  function ensureProviderQueue(provider) {
    const clean = cleanProvider(provider);

    if (!clean) {
      return null;
    }

    if (!state.providerQueues[clean]) {
      state.providerQueues[clean] = {
        provider: clean,
        created_at: now(),
        updated_at: now(),
        inbox: [],
        pulled_count: 0,
        queued_count: 0
      };
    }

    return state.providerQueues[clean];
  }

  function isProviderEnvelope(input = {}) {
    if (!input || typeof input !== "object") {
      return false;
    }

    return (
      input.status === ACCEPTED_ENVELOPE_STATUS &&
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

  function contractAllows(input = {}) {
    configure();

    if (
      ProviderAdapterContract &&
      typeof ProviderAdapterContract.canProviderExecute === "function"
    ) {
      return ProviderAdapterContract.canProviderExecute(input);
    }

    return isProviderEnvelope(input);
  }

  function recordReceived(input = {}) {
    const record = {
      id: makeId("providerQueueReceive"),
      received_at: now(),
      input: clone(input),
      queued: false,
      provider_ready: false,
      external_call_allowed: false,
      provider_call_executed: false,
      authority_allowed: false,
      executed: false,
      status: "received_by_net_provider_queue"
    };

    state.received.push(record);
    return record;
  }

  function validateEnvelope(input = {}) {
    if (!input || typeof input !== "object") {
      return {
        valid: false,
        reason: "INVALID_PROVIDER_QUEUE_INPUT"
      };
    }

    if (containsBlockedMaterial(input)) {
      return {
        valid: false,
        reason: "PROVIDER_QUEUE_BLOCKED_SENSITIVE_OR_000_MATERIAL"
      };
    }

    if (!isProviderEnvelope(input)) {
      return {
        valid: false,
        reason: "PROVIDER_QUEUE_REQUIRES_PROVIDER_READY_ENVELOPE"
      };
    }

    if (!contractAllows(input)) {
      return {
        valid: false,
        reason: "PROVIDER_ADAPTER_CONTRACT_DID_NOT_ALLOW_QUEUE"
      };
    }

    return {
      valid: true,
      reason: "PROVIDER_READY_ENVELOPE_ACCEPTED_FOR_QUEUE"
    };
  }

  function enqueue(input = {}) {
    configure();

    const received = recordReceived(input);
    const validation = validateEnvelope(input);

    if (!validation.valid) {
      return hold(
        {
          received,
          validation,
          input
        },
        validation.reason
      );
    }

    const provider = cleanProvider(input.provider);
    const providerQueue = ensureProviderQueue(provider);

    if (!providerQueue) {
      return hold(
        {
          received,
          input
        },
        "PROVIDER_QUEUE_REQUIRES_PROVIDER"
      );
    }

    const queued = {
      id: makeId("providerQueued"),
      queued_at: now(),
      provider,
      source_envelope_id: input.id || null,
      envelope: clone(input),
      received_id: received.id,
      queued: true,
      provider_ready: true,
      external_call_allowed: true,
      provider_call_executed: false,
      authority_allowed: true,
      release_allowed: true,
      certificate_valid: true,
      executed: false,
      status: "provider_envelope_queued_no_execution"
    };

    providerQueue.inbox.push(queued);
    providerQueue.queued_count += 1;
    providerQueue.updated_at = queued.queued_at;

    state.queued.push(queued);
    return queued;
  }

  function receiveFromContract(input = {}, options = {}) {
    configure(options.deps || {});

    if (isProviderEnvelope(input)) {
      return enqueue(input);
    }

    if (
      !ProviderAdapterContract ||
      typeof ProviderAdapterContract.review !== "function"
    ) {
      return hold(input, "PROVIDER_ADAPTER_CONTRACT_NOT_AVAILABLE");
    }

    const envelope = ProviderAdapterContract.review(input, options);

    if (!isProviderEnvelope(envelope)) {
      return hold(
        {
          input,
          envelope
        },
        "PROVIDER_ADAPTER_CONTRACT_DID_NOT_CREATE_QUEUEABLE_ENVELOPE"
      );
    }

    return enqueue(envelope);
  }

  function peekProvider(provider) {
    const clean = cleanProvider(provider);

    if (!clean || !state.providerQueues[clean]) {
      return [];
    }

    return clone(state.providerQueues[clean].inbox);
  }

  function pullNext(provider) {
    const clean = cleanProvider(provider);

    if (!clean || !state.providerQueues[clean]) {
      return hold(
        {
          provider
        },
        "PROVIDER_QUEUE_NOT_FOUND"
      );
    }

    const providerQueue = state.providerQueues[clean];
    const next = providerQueue.inbox.shift();

    if (!next) {
      return hold(
        {
          provider: clean
        },
        "PROVIDER_QUEUE_EMPTY"
      );
    }

    providerQueue.pulled_count += 1;
    providerQueue.updated_at = now();

    const pulled = {
      id: makeId("providerQueuePull"),
      pulled_at: now(),
      provider: clean,
      queued_record: clone(next),
      provider_ready: true,
      external_call_allowed: true,
      provider_call_executed: false,
      authority_allowed: true,
      release_allowed: true,
      certificate_valid: true,
      executed: false,
      status: "provider_envelope_pulled_no_execution"
    };

    state.pulled.push(pulled);
    return pulled;
  }

  function requeue(pulledRecord = {}, reason = "REQUEUED_PROVIDER_ENVELOPE") {
    if (
      !pulledRecord ||
      typeof pulledRecord !== "object" ||
      pulledRecord.status !== "provider_envelope_pulled_no_execution"
    ) {
      return hold(pulledRecord, "INVALID_PROVIDER_PULL_RECORD_FOR_REQUEUE");
    }

    const queuedRecord = pulledRecord.queued_record;

    if (!queuedRecord || !queuedRecord.envelope) {
      return hold(pulledRecord, "PULLED_RECORD_MISSING_QUEUE_ENVELOPE");
    }

    const provider = cleanProvider(pulledRecord.provider || queuedRecord.provider);
    const providerQueue = ensureProviderQueue(provider);

    const requeued = {
      ...clone(queuedRecord),
      id: makeId("providerRequeued"),
      queued_at: now(),
      reason,
      status: "provider_envelope_requeued_no_execution"
    };

    providerQueue.inbox.push(requeued);
    providerQueue.queued_count += 1;
    providerQueue.updated_at = requeued.queued_at;

    state.queued.push(requeued);
    return requeued;
  }

  function listProviders() {
    return Object.keys(state.providerQueues).map((provider) => {
      const queue = state.providerQueues[provider];

      return {
        provider,
        created_at: queue.created_at,
        updated_at: queue.updated_at,
        inbox_count: queue.inbox.length,
        queued_count: queue.queued_count,
        pulled_count: queue.pulled_count
      };
    });
  }

  function canProviderAdapterPull(result = {}) {
    return Boolean(
      result &&
      typeof result === "object" &&
      result.status === "provider_envelope_pulled_no_execution" &&
      result.provider_ready === true &&
      result.external_call_allowed === true &&
      result.provider_call_executed === false &&
      result.authority_allowed === true &&
      result.release_allowed === true &&
      result.certificate_valid === true &&
      result.executed === false &&
      Boolean(result.provider)
    );
  }

  function canExecuteHere() {
    return false;
  }

  function getState() {
    return clone(state);
  }

  return {
    configure,
    enqueue,
    receiveFromContract,
    validateEnvelope,
    isProviderEnvelope,
    contractAllows,
    containsBlockedMaterial,
    peekProvider,
    pullNext,
    requeue,
    listProviders,
    canProviderAdapterPull,
    canExecuteHere,
    hold,
    reject,
    getState
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCrowdNetProviderQueue;
}
