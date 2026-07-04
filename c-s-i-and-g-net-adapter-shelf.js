// c-s-i-and-g-net-adapter-shelf.js
// CyberCrowd — NET Adapter Shelf
//
// Owns:
// - registering future NET adapters
// - holding adapter definitions without provider execution
// - checking adapter readiness before any NET inbox pull
// - pulling sanitized records from the NET Receiver inbox
// - assigning NET inbox records to a registered adapter shelf slot
// - preserving adapter handoff trail without external calls
//
// Does NOT own:
// - provider-specific adapters
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

const CyberCrowdNetAdapterShelf = (() => {
  const ACCEPTED_RECEIVER_STATUS = "net_receiver_accepted_no_external_call";

  const ADAPTER_STATUS = {
    REGISTERED: "adapter_registered",
    READY: "adapter_ready_no_external_call",
    PAUSED: "adapter_paused",
    BLOCKED: "adapter_blocked",
    HELD: "adapter_held"
  };

  const state = {
    configured: false,
    adapters: Object.create(null),
    registrations: [],
    assignments: [],
    pulled: [],
    held: [],
    rejected: []
  };

  let NetReceiver = null;

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
    NetReceiver =
      deps.NetReceiver ||
      deps.netReceiver ||
      deps.receiver ||
      NetReceiver ||
      safeRequire("./c-s-i-and-g-net-receiver.js") ||
      null;

    state.configured = Boolean(NetReceiver);

    return {
      configured: state.configured,
      has_net_receiver: Boolean(NetReceiver)
    };
  }

  function hold(target, reason) {
    const record = {
      id: makeId("netAdapterShelfHold"),
      held_at: now(),
      reason,
      target: clone(target),
      adapter_ready: false,
      net_ready: false,
      external_call_allowed: false,
      executed: false,
      status: "held_by_net_adapter_shelf"
    };

    state.held.push(record);
    return record;
  }

  function reject(target, reason) {
    const record = {
      id: makeId("netAdapterShelfReject"),
      rejected_at: now(),
      reason,
      target: clone(target),
      adapter_ready: false,
      net_ready: false,
      external_call_allowed: false,
      executed: false,
      status: "rejected_by_net_adapter_shelf"
    };

    state.rejected.push(record);
    return record;
  }

  function cleanAdapterId(value) {
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

  function normalizeAdapter(input = {}) {
    const adapterId = cleanAdapterId(
      input.adapter_id ||
      input.id ||
      input.name ||
      input.label
    );

    if (!adapterId) {
      return null;
    }

    return {
      adapter_id: adapterId,
      name: input.name || adapterId,
      kind: input.kind || "future_net_adapter",
      description: input.description || "Future NET adapter shelf slot",
      accepts: Array.isArray(input.accepts)
        ? clone(input.accepts)
        : ["net_receiver_accepted_record"],
      status: input.ready === true
        ? ADAPTER_STATUS.READY
        : ADAPTER_STATUS.REGISTERED,
      registered_at: now(),
      updated_at: now(),
      enabled: input.enabled === true,
      adapter_ready: input.ready === true,
      net_ready: false,
      external_call_allowed: false,
      executed: false,
      inbox: [],
      assigned_count: 0,
      notes: Array.isArray(input.notes) ? clone(input.notes) : []
    };
  }

  function registerAdapter(input = {}) {
    const adapter = normalizeAdapter(input);

    if (!adapter) {
      return reject(input, "INVALID_ADAPTER_REGISTRATION");
    }

    if (state.adapters[adapter.adapter_id]) {
      return hold(
        {
          input,
          existing: state.adapters[adapter.adapter_id]
        },
        "ADAPTER_ALREADY_REGISTERED"
      );
    }

    state.adapters[adapter.adapter_id] = adapter;

    const registration = {
      id: makeId("netAdapterRegistration"),
      registered_at: now(),
      adapter: clone(adapter),
      external_call_allowed: false,
      executed: false,
      status: "net_adapter_registered_on_shelf"
    };

    state.registrations.push(registration);
    return registration;
  }

  function getAdapter(adapterId) {
    const cleanId = cleanAdapterId(adapterId);

    if (!cleanId || !state.adapters[cleanId]) {
      return null;
    }

    return state.adapters[cleanId];
  }

  function setAdapterReady(adapterId, ready = true, reason = null) {
    const adapter = getAdapter(adapterId);

    if (!adapter) {
      return reject(
        {
          adapter_id: adapterId
        },
        "ADAPTER_NOT_FOUND"
      );
    }

    adapter.adapter_ready = ready === true;
    adapter.enabled = ready === true;
    adapter.status = ready === true
      ? ADAPTER_STATUS.READY
      : ADAPTER_STATUS.REGISTERED;
    adapter.updated_at = now();

    if (reason) {
      adapter.notes.push({
        noted_at: now(),
        reason
      });
    }

    return {
      id: makeId("netAdapterReady"),
      updated_at: now(),
      adapter: clone(adapter),
      adapter_ready: adapter.adapter_ready,
      external_call_allowed: false,
      executed: false,
      status: "net_adapter_readiness_updated"
    };
  }

  function pauseAdapter(adapterId, reason = "ADAPTER_PAUSED") {
    const adapter = getAdapter(adapterId);

    if (!adapter) {
      return reject(
        {
          adapter_id: adapterId
        },
        "ADAPTER_NOT_FOUND"
      );
    }

    adapter.enabled = false;
    adapter.adapter_ready = false;
    adapter.status = ADAPTER_STATUS.PAUSED;
    adapter.updated_at = now();
    adapter.notes.push({
      noted_at: now(),
      reason
    });

    return {
      id: makeId("netAdapterPause"),
      paused_at: now(),
      adapter: clone(adapter),
      adapter_ready: false,
      external_call_allowed: false,
      executed: false,
      status: "net_adapter_paused"
    };
  }

  function blockAdapter(adapterId, reason = "ADAPTER_BLOCKED") {
    const adapter = getAdapter(adapterId);

    if (!adapter) {
      return reject(
        {
          adapter_id: adapterId
        },
        "ADAPTER_NOT_FOUND"
      );
    }

    adapter.enabled = false;
    adapter.adapter_ready = false;
    adapter.status = ADAPTER_STATUS.BLOCKED;
    adapter.updated_at = now();
    adapter.notes.push({
      noted_at: now(),
      reason
    });

    return {
      id: makeId("netAdapterBlock"),
      blocked_at: now(),
      adapter: clone(adapter),
      adapter_ready: false,
      external_call_allowed: false,
      executed: false,
      status: "net_adapter_blocked"
    };
  }

  function isReceiverRecordReady(record = {}) {
    if (!record || typeof record !== "object") {
      return false;
    }

    return (
      record.status === ACCEPTED_RECEIVER_STATUS &&
      record.net_accepted === true &&
      record.net_ready === true &&
      record.authority_allowed === true &&
      record.release_allowed === true &&
      record.certificate_valid === true &&
      record.external_call_allowed === false &&
      record.executed === false
    );
  }

  function canAdapterReceive(adapterId) {
    const adapter = getAdapter(adapterId);

    if (!adapter) {
      return {
        allowed: false,
        reason: "ADAPTER_NOT_FOUND"
      };
    }

    if (adapter.status === ADAPTER_STATUS.BLOCKED) {
      return {
        allowed: false,
        reason: "ADAPTER_BLOCKED"
      };
    }

    if (adapter.status === ADAPTER_STATUS.PAUSED) {
      return {
        allowed: false,
        reason: "ADAPTER_PAUSED"
      };
    }

    if (adapter.enabled !== true || adapter.adapter_ready !== true) {
      return {
        allowed: false,
        reason: "ADAPTER_NOT_READY"
      };
    }

    return {
      allowed: true,
      reason: "ADAPTER_READY_TO_RECEIVE"
    };
  }

  function pullFromReceiver() {
    configure();

    if (!NetReceiver || typeof NetReceiver.pullNext !== "function") {
      return hold(null, "NET_RECEIVER_NOT_AVAILABLE");
    }

    const record = NetReceiver.pullNext();

    if (!record) {
      return hold(null, "NET_RECEIVER_INBOX_EMPTY");
    }

    if (!isReceiverRecordReady(record)) {
      return hold(record, "NET_RECEIVER_RECORD_NOT_READY_FOR_ADAPTER_SHELF");
    }

    const pulled = {
      id: makeId("netAdapterPull"),
      pulled_at: now(),
      record: clone(record),
      external_call_allowed: false,
      executed: false,
      status: "pulled_from_net_receiver"
    };

    state.pulled.push(pulled);
    return pulled;
  }

  function assignToAdapter(adapterId, receiverRecord) {
    const adapter = getAdapter(adapterId);
    const readiness = canAdapterReceive(adapterId);

    if (!adapter) {
      return reject(
        {
          adapter_id: adapterId,
          receiverRecord
        },
        "ADAPTER_NOT_FOUND"
      );
    }

    if (!readiness.allowed) {
      return hold(
        {
          adapter: clone(adapter),
          receiverRecord,
          readiness
        },
        readiness.reason
      );
    }

    if (!isReceiverRecordReady(receiverRecord)) {
      return hold(
        {
          adapter: clone(adapter),
          receiverRecord
        },
        "RECEIVER_RECORD_FAILED_ASSIGNMENT_RULES"
      );
    }

    const assignment = {
      id: makeId("netAdapterAssignment"),
      assigned_at: now(),
      adapter_id: adapter.adapter_id,
      adapter_name: adapter.name,
      adapter_kind: adapter.kind,
      receiver_record: clone(receiverRecord),
      adapter_ready: true,
      net_ready: true,
      authority_allowed: true,
      release_allowed: true,
      certificate_valid: true,
      external_call_allowed: false,
      executed: false,
      status: "assigned_to_net_adapter_shelf_no_external_call"
    };

    adapter.inbox.push(assignment);
    adapter.assigned_count += 1;
    adapter.updated_at = assignment.assigned_at;

    state.assignments.push(assignment);

    return assignment;
  }

  function pullForAdapter(adapterId) {
    const readiness = canAdapterReceive(adapterId);

    if (!readiness.allowed) {
      return hold(
        {
          adapter_id: adapterId,
          readiness
        },
        readiness.reason
      );
    }

    const pulled = pullFromReceiver();

    if (
      !pulled ||
      typeof pulled !== "object" ||
      pulled.status !== "pulled_from_net_receiver"
    ) {
      return hold(
        {
          adapter_id: adapterId,
          pulled
        },
        "NO_RECEIVER_RECORD_AVAILABLE_FOR_ADAPTER"
      );
    }

    return assignToAdapter(adapterId, pulled.record);
  }

  function peekAdapterInbox(adapterId) {
    const adapter = getAdapter(adapterId);

    if (!adapter) {
      return [];
    }

    return clone(adapter.inbox);
  }

  function pullAdapterAssignment(adapterId) {
    const adapter = getAdapter(adapterId);

    if (!adapter) {
      return null;
    }

    const next = adapter.inbox.shift();

    if (!next) {
      return null;
    }

    return clone(next);
  }

  function listAdapters() {
    return Object.keys(state.adapters).map((adapterId) => {
      return clone(state.adapters[adapterId]);
    });
  }

  function canExternalCall(result) {
    return Boolean(
      result &&
      typeof result === "object" &&
      result.status === "assigned_to_net_adapter_shelf_no_external_call" &&
      result.adapter_ready === true &&
      result.net_ready === true &&
      result.authority_allowed === true &&
      result.release_allowed === true &&
      result.certificate_valid === true &&
      result.external_call_allowed === false &&
      result.executed === false
    );
  }

  function getState() {
    return clone(state);
  }

  return {
    ADAPTER_STATUS,
    configure,
    registerAdapter,
    setAdapterReady,
    pauseAdapter,
    blockAdapter,
    getAdapter,
    listAdapters,
    canAdapterReceive,
    pullFromReceiver,
    assignToAdapter,
    pullForAdapter,
    peekAdapterInbox,
    pullAdapterAssignment,
    isReceiverRecordReady,
    canExternalCall,
    hold,
    reject,
    getState
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCrowdNetAdapterShelf;
}
