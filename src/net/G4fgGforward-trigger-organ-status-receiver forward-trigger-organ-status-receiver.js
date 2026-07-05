/*
  CyberCrowd NET — Forward Trigger Organ Status Receiver

  Owns:
  - receiving sanitized forward-trigger organ status snapshots from Core
  - receiving paper-ladder rows for display/transport
  - exposing NET-safe status views
  - keeping NET informed without giving NET control

  Does NOT:
  - run the forward-trigger organ
  - create value lanes
  - open Biff gates
  - record user decisions
  - create TOFU units
  - publish anything
  - sell data
  - decide identity
  - trigger Octopus movement
  - bypass the user
  - store credentials
  - scrape providers
  - expose private evidence, raw provider payloads, OAuth tokens, cookies, sessions, KV, or secrets

  Doctrine:
  Core records.
  NET receives.
  NET displays/transports.
  NET does not control.
*/

const CyberCrowdNETForwardTriggerOrganStatusReceiver = (() => {
  let receivedRecords = new Map();

  const ALLOWED_RECORD_TYPES = [
    "forward_trigger_cycle",
    "forward_trigger_user_choice",
    "paper_ladder_forward_trigger_cycle",
    "paper_ladder_forward_trigger_choice",
    "paper_ladder_forward_trigger_unknown",
  ];

  const BLOCKED_KEYS = [
    "password",
    "secret",
    "token",
    "cookie",
    "session",
    "oauth",
    "credential",
    "private_key",
    "raw_provider_payload",
    "raw_reference",
    "kv",
    "precise_location",
    "biometric",
    "health_raw",
  ];

  function now() {
    return new Date().toISOString();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function makeId(prefix) {
    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }

  function requireText(value, errorCode) {
    if (!value || typeof value !== "string" || !value.trim()) {
      throw new Error(errorCode);
    }

    return value.trim();
  }

  function normalizeText(value) {
    if (typeof value !== "string") return "";

    return value.trim().toLowerCase().replace(/\s+/g, " ");
  }

  function includesBlockedKey(key) {
    const cleanKey = normalizeText(key);

    return BLOCKED_KEYS.some((blocked) => {
      return cleanKey.includes(blocked);
    });
  }

  function sanitizeValue(value) {
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }

    if (value && typeof value === "object") {
      return sanitizeObject(value);
    }

    return value;
  }

  function sanitizeObject(input = {}) {
    const output = {};

    Object.keys(input).forEach((key) => {
      if (includesBlockedKey(key)) {
        output[key] = "[REDACTED_FOR_NET]";
        return;
      }

      output[key] = sanitizeValue(input[key]);
    });

    return output;
  }

  function assertNETSafe(packet = {}) {
    const text = JSON.stringify(packet).toLowerCase();

    const found = BLOCKED_KEYS.find((key) => {
      return text.includes(`"${key}`) || text.includes(`${key}:`);
    });

    if (found) {
      return {
        safe: false,
        reason: `Blocked NET field detected: ${found}`,
      };
    }

    return {
      safe: true,
      reason: "Packet passed NET safety check.",
    };
  }

  function normalizePacket(packet = {}) {
    if (!packet || typeof packet !== "object") {
      throw new Error("STATUS_PACKET_REQUIRED");
    }

    const sanitized = sanitizeObject(packet);

    const recordType =
      sanitized.record_type ||
      sanitized.row_type ||
      sanitized.status_type ||
      "forward_trigger_status";

    if (
      ALLOWED_RECORD_TYPES.includes(recordType) === false &&
      recordType !== "forward_trigger_status"
    ) {
      throw new Error("UNSUPPORTED_FORWARD_TRIGGER_STATUS_TYPE");
    }

    return {
      net_record_id: makeId("netForwardTriggerStatus"),
      source_record_id:
        sanitized.record_id ||
        sanitized.cycle_id ||
        sanitized.gate_id ||
        sanitized.proposal_id ||
        null,
      record_type: recordType,
      organ: sanitized.organ || "forward_trigger",
      uidl: sanitized.uidl || null,
      status: sanitized.status || sanitized.user_choice || "received",
      subject: sanitized.subject || null,
      proposed_lane: sanitized.proposed_lane || null,
      movement_allowed: false,
      publish_allowed: false,
      net_control_allowed: false,
      received_at: now(),
      payload: sanitized,
    };
  }

  function receiveStatus(packet = {}) {
    const normalized = normalizePacket(packet);
    const safety = assertNETSafe(normalized.payload);

    if (!safety.safe) {
      return {
        accepted: false,
        status: "rejected_unsafe_for_net",
        reason: safety.reason,
        received_at: now(),
      };
    }

    receivedRecords.set(normalized.net_record_id, normalized);

    return {
      accepted: true,
      status: "received",
      net_record_id: normalized.net_record_id,
      source_record_id: normalized.source_record_id,
      record_type: normalized.record_type,
      organ: normalized.organ,
      uidl: normalized.uidl,
      movement_allowed: false,
      publish_allowed: false,
      net_control_allowed: false,
      received_at: normalized.received_at,
    };
  }

  function receiveMany(packets = []) {
    if (!Array.isArray(packets)) {
      throw new Error("STATUS_PACKET_LIST_REQUIRED");
    }

    return {
      status: "batch_received",
      received_at: now(),
      results: packets.map((packet) => receiveStatus(packet)),
    };
  }

  function makeDisplayCard(netRecordId) {
    const record = getRecord(netRecordId);

    if (!record) {
      throw new Error("NET_RECORD_NOT_FOUND");
    }

    const payload = record.payload || {};

    return {
      card_type: "net_forward_trigger_status",
      net_record_id: record.net_record_id,
      source_record_id: record.source_record_id,
      organ: "forward_trigger",
      title: makeTitle(record),
      uidl: record.uidl,
      subject: record.subject || payload.subject || null,
      proposed_lane: record.proposed_lane || payload.proposed_lane || null,
      status: record.status,
      message: makeMessage(record),
      movement_allowed: false,
      publish_allowed: false,
      net_control_allowed: false,
      received_at: record.received_at,
    };
  }

  function makeTitle(record) {
    if (record.record_type === "forward_trigger_cycle") {
      return "Forward trigger cycle recorded";
    }

    if (record.record_type === "forward_trigger_user_choice") {
      return "Forward trigger choice recorded";
    }

    if (String(record.record_type).startsWith("paper_ladder")) {
      return "Forward trigger paper ladder row";
    }

    return "Forward trigger status received";
  }

  function makeMessage(record) {
    const payload = record.payload || {};

    if (record.record_type === "forward_trigger_cycle") {
      return payload.summary || "Core recorded a forward-trigger cycle.";
    }

    if (record.record_type === "forward_trigger_user_choice") {
      return `User choice recorded: ${payload.user_choice || record.status}.`;
    }

    if (String(record.record_type).startsWith("paper_ladder")) {
      return payload.summary || "Paper ladder row is available for display.";
    }

    return "NET received a sanitized forward-trigger status snapshot.";
  }

  function getRecord(netRecordId) {
    const cleanId = requireText(netRecordId, "NET_RECORD_ID_REQUIRED");
    const record = receivedRecords.get(cleanId);

    return record ? clone(record) : null;
  }

  function listRecords(uidl = null) {
    const cleanUIDL =
      typeof uidl === "string" && uidl.trim()
        ? normalizeText(uidl)
        : null;

    return Array.from(receivedRecords.values())
      .filter((record) => {
        if (!cleanUIDL) return true;
        return normalizeText(record.uidl || "") === cleanUIDL;
      })
      .map(clone);
  }

  function listDisplayCards(uidl = null) {
    return listRecords(uidl).map((record) => {
      return makeDisplayCard(record.net_record_id);
    });
  }

  function makeTransportEnvelope(netRecordId) {
    const record = getRecord(netRecordId);

    if (!record) {
      throw new Error("NET_RECORD_NOT_FOUND");
    }

    return {
      envelope_type: "net_forward_trigger_status_transport",
      envelope_id: makeId("forwardTriggerStatusEnvelope"),
      net_record_id: record.net_record_id,
      source_record_id: record.source_record_id,
      organ: "forward_trigger",
      uidl: record.uidl,
      record_type: record.record_type,
      payload: record.payload,
      movement_allowed: false,
      publish_allowed: false,
      net_control_allowed: false,
      created_at: now(),
    };
  }

  function reset() {
    receivedRecords = new Map();

    return {
      status: "reset",
      reset_at: now(),
    };
  }

  return {
    receiveStatus,
    receiveMany,
    makeDisplayCard,
    listDisplayCards,
    makeTransportEnvelope,
    getRecord,
    listRecords,
    reset,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCrowdNETForwardTriggerOrganStatusReceiver;
}

if (typeof window !== "undefined") {
  window.CyberCrowdNETForwardTriggerOrganStatusReceiver =
    CyberCrowdNETForwardTriggerOrganStatusReceiver;
}
