// src/net/proximity-intent-status-receiver.js
// CyberCrowd NET — Proximity Intent Status Receiver
// Owns: receiving safe Core proximity intent route summaries for NET/display transport.
// Rule: NET can show the safe route state. NET does not run Proximity.
// Does not: score venues, track humans, choose for user, place orders, publish presence,
// run POS, run payments, expose private uIDL data, or deal directly with the customer.

const ProximityIntentStatusReceiver = (() => {
  const receivedStatuses = [];

  function now() {
    return new Date().toISOString();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function makeId(prefix) {
    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }

  function requireObject(value, errorCode) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(errorCode);
    }

    return value;
  }

  function requireText(value, errorCode) {
    if (!value || typeof value !== "string" || !value.trim()) {
      throw new Error(errorCode);
    }

    return value.trim();
  }

  function normalizeText(value) {
    if (!value || typeof value !== "string") {
      return "";
    }

    return value.trim();
  }

  function normalizeNumber(value, fallback = null) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return number;
  }

  function normalizeList(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  function normalizeStatus(status = {}) {
    const cleanStatus = requireObject(status, "STATUS_REQUIRED");

    return {
      received_id: makeId("proximityNetStatus"),
      received_at: now(),
      source: "core.proximity-intent-router",
      route_id: requireText(cleanStatus.route_id, "ROUTE_ID_REQUIRED"),
      uidl_hint: normalizeText(cleanStatus.uidl_hint),
      status: requireText(cleanStatus.status, "STATUS_REQUIRED"),
      message: normalizeText(cleanStatus.message),
      route_created_at: normalizeText(cleanStatus.created_at),
      route_updated_at: normalizeText(cleanStatus.updated_at),
      candidates: normalizeCandidates(cleanStatus.candidates),
      approvals: normalizeApprovals(cleanStatus.approvals),
      blocked_reason: normalizeText(cleanStatus.reason),
      rejection_reason: normalizeText(cleanStatus.rejection_reason),
      display_summary: normalizeDisplaySummary(cleanStatus.display_summary),
    };
  }

  function normalizeCandidates(candidates) {
    if (!Array.isArray(candidates)) {
      return [];
    }

    return candidates.map((candidate) => normalizeCandidate(candidate));
  }

  function normalizeCandidate(candidate = {}) {
    const cleanCandidate = requireObject(candidate, "CANDIDATE_REQUIRED");
    const venue = cleanCandidate.venue && typeof cleanCandidate.venue === "object"
      ? cleanCandidate.venue
      : {};

    const score = cleanCandidate.score && typeof cleanCandidate.score === "object"
      ? cleanCandidate.score
      : {};

    return {
      candidate_route_id: requireText(cleanCandidate.route_id, "CANDIDATE_ROUTE_ID_REQUIRED"),
      status: normalizeText(cleanCandidate.status),
      venue: {
        venue_id: normalizeText(venue.venue_id),
        name: normalizeText(venue.name),
        distance_miles: normalizeNumber(venue.distance_miles, null),
        has_food: Boolean(venue.has_food),
        has_drinks: Boolean(venue.has_drinks),
        notes: normalizeText(venue.notes),
      },
      score: {
        total: normalizeNumber(score.total, 0),
        reasons: normalizeList(score.reasons),
        warnings: normalizeList(score.warnings),
      },
      suggested_actions: normalizeSuggestedActions(cleanCandidate.suggested_actions),
    };
  }

  function normalizeSuggestedActions(actions) {
    if (!Array.isArray(actions)) {
      return [];
    }

    return actions.map((action) => {
      const cleanAction = requireObject(action, "ACTION_REQUIRED");

      return {
        action_type: normalizeText(cleanAction.action_type),
        label: normalizeText(cleanAction.label),
        requires_user_approval: cleanAction.requires_user_approval !== false,
        presence_mode: normalizeText(cleanAction.presence_mode),
        warnings: normalizeList(cleanAction.warnings),
        item_count: Array.isArray(cleanAction.items) ? cleanAction.items.length : 0,
      };
    });
  }

  function normalizeApprovals(approvals) {
    if (!Array.isArray(approvals)) {
      return [];
    }

    return approvals.map((approval) => {
      const cleanApproval = requireObject(approval, "APPROVAL_REQUIRED");

      return {
        approval_id: normalizeText(cleanApproval.approval_id),
        approved_at: normalizeText(cleanApproval.approved_at),
        route_id: normalizeText(cleanApproval.route_id),
        candidate_route_id: normalizeText(cleanApproval.candidate_route_id),
        action_type: normalizeText(cleanApproval.action_type),
        venue_id: normalizeText(cleanApproval.venue_id),
        venue_name: normalizeText(cleanApproval.venue_name),
        status: normalizeText(cleanApproval.status),
      };
    });
  }

  function normalizeDisplaySummary(displaySummary = {}) {
    if (!displaySummary || typeof displaySummary !== "object" || Array.isArray(displaySummary)) {
      return {
        headline: "",
        body: "",
        safe_tags: [],
      };
    }

    return {
      headline: normalizeText(displaySummary.headline),
      body: normalizeText(displaySummary.body),
      safe_tags: normalizeList(displaySummary.safe_tags),
    };
  }

  function receiveStatus(status = {}) {
    const normalized = normalizeStatus(status);

    normalized.net_state = deriveNetState(normalized);
    normalized.display_cards = buildDisplayCards(normalized);
    normalized.paper_ladder_row = buildPaperLadderRow(normalized);

    receivedStatuses.push(clone(normalized));

    return clone(normalized);
  }

  function deriveNetState(status) {
    if (status.status === "blocked") {
      return "blocked";
    }

    if (status.status === "no_match") {
      return "no_match";
    }

    if (status.status === "rejected") {
      return "rejected";
    }

    if (status.approvals.length) {
      return "approved_handoff_ready";
    }

    if (status.candidates.length) {
      return "ready_for_choice";
    }

    return "waiting";
  }

  function buildDisplayCards(status) {
    if (status.net_state === "blocked") {
      return [
        {
          card_type: "PROXIMITY_BLOCKED",
          headline: "Proximity paused",
          body: status.message || "Proximity cannot route right now.",
          safe_status: status.blocked_reason || "blocked",
        },
      ];
    }

    if (status.net_state === "no_match") {
      return [
        {
          card_type: "PROXIMITY_NO_MATCH",
          headline: "No nearby path matched",
          body: status.message || "No allowed venue path matched the current intent.",
          safe_status: "no_match",
        },
      ];
    }

    if (status.net_state === "approved_handoff_ready") {
      return status.approvals.map((approval) => ({
        card_type: "PROXIMITY_APPROVAL",
        headline: "Approved handoff ready",
        body: `${approval.venue_name || "Venue"} is ready for ${approval.action_type || "handoff"}.`,
        safe_status: approval.status || "approved_for_handoff",
        approval_id: approval.approval_id,
      }));
    }

    if (status.net_state === "ready_for_choice") {
      return status.candidates.map((candidate) => ({
        card_type: "PROXIMITY_CHOICE",
        headline: candidate.venue.name || "Nearby option",
        body: buildCandidateBody(candidate),
        safe_status: "ready_for_choice",
        candidate_route_id: candidate.candidate_route_id,
        venue_id: candidate.venue.venue_id,
        action_count: candidate.suggested_actions.length,
      }));
    }

    if (status.net_state === "rejected") {
      return [
        {
          card_type: "PROXIMITY_REJECTED",
          headline: "Proximity route dismissed",
          body: status.rejection_reason || "The route was rejected by the user.",
          safe_status: "rejected",
        },
      ];
    }

    return [
      {
        card_type: "PROXIMITY_WAITING",
        headline: "Proximity waiting",
        body: status.message || "Waiting for allowed proximity route status.",
        safe_status: "waiting",
      },
    ];
  }

  function buildCandidateBody(candidate) {
    const pieces = [];

    if (candidate.venue.distance_miles !== null) {
      pieces.push(`${candidate.venue.distance_miles} miles away`);
    }

    if (candidate.venue.has_food) {
      pieces.push("food");
    }

    if (candidate.venue.has_drinks) {
      pieces.push("drinks");
    }

    if (candidate.score.reasons.length) {
      pieces.push(candidate.score.reasons.join(", "));
    }

    if (candidate.score.warnings.length) {
      pieces.push(`check: ${candidate.score.warnings.join(", ")}`);
    }

    return pieces.join(" · ") || "Nearby option ready for user choice.";
  }

  function buildPaperLadderRow(status) {
    return {
      row_id: makeId("proximityPaperRow"),
      route_id: status.route_id,
      received_at: status.received_at,
      net_state: status.net_state,
      candidate_count: status.candidates.length,
      approval_count: status.approvals.length,
      safe_message: status.message,
      boundary: "NET_RECEIVES_ONLY",
    };
  }

  function listStatuses(filter = {}) {
    const cleanFilter = filter && typeof filter === "object" ? filter : {};
    const status = normalizeText(cleanFilter.status);
    const netState = normalizeText(cleanFilter.net_state);
    const routeId = normalizeText(cleanFilter.route_id);

    return receivedStatuses
      .filter((item) => {
        if (status && item.status !== status) {
          return false;
        }

        if (netState && item.net_state !== netState) {
          return false;
        }

        if (routeId && item.route_id !== routeId) {
          return false;
        }

        return true;
      })
      .map(clone);
  }

  function latestStatus() {
    if (!receivedStatuses.length) {
      return null;
    }

    return clone(receivedStatuses[receivedStatuses.length - 1]);
  }

  function clearStatuses() {
    receivedStatuses.length = 0;
    return true;
  }

  return {
    receiveStatus,
    listStatuses,
    latestStatus,
    clearStatuses,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = ProximityIntentStatusReceiver;
}
