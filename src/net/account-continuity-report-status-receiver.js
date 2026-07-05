// src/net/account-continuity-report-status-receiver.js
// CyberCrowd NET — Account Continuity Report Status Receiver
// Owns: receiving safe Core account continuity report summaries for NET/display/email transport.
// Rule: NET can show report status. NET does not create the report.
// Email can identify the report. Email cannot expose the person.
// Does not: send email, run payments, delete accounts, recover accounts, expose private identity,
// include proof material, expose archive contents, store email credentials, or deal directly with customer.

const AccountContinuityReportStatusReceiver = (() => {
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

  function normalizeBoolean(value) {
    return value === true;
  }

  function normalizeNumber(value, fallback = 0) {
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
      received_id: makeId("accountContinuityNetStatus"),
      received_at: now(),
      source: "core.account-continuity-report-status-ledger",
      report_id: requireText(cleanStatus.report_id, "REPORT_ID_REQUIRED"),
      report_type: normalizeText(cleanStatus.report_type) || "monthly",
      uidl_hint: normalizeText(cleanStatus.uidl_hint),
      account_number: normalizeText(cleanStatus.account_number),
      account_tag: normalizeText(cleanStatus.account_tag),
      report_email_hint: normalizeText(cleanStatus.report_email_hint),
      status: requireText(cleanStatus.status, "STATUS_REQUIRED"),
      ledger_state: normalizeText(cleanStatus.ledger_state),
      subject: normalizeText(cleanStatus.subject),
      email_only: cleanStatus.email_only !== false,
      identity_boundary: normalizeText(cleanStatus.identity_boundary),
      display_summary: normalizeDisplaySummary(cleanStatus.display_summary),
      continuity_summary: normalizeContinuitySummary(cleanStatus.continuity_summary),
      safe_identifier_rule: normalizeSafeIdentifierRule(cleanStatus.safe_identifier_rule),
      email_handoff: normalizeEmailHandoff(cleanStatus.email_handoff),
      next_actions: normalizeNextActions(cleanStatus.next_actions),
    };
  }

  function normalizeDisplaySummary(summary = {}) {
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      return {
        headline: "",
        body: "",
        safe_tags: [],
      };
    }

    return {
      headline: normalizeText(summary.headline),
      body: normalizeText(summary.body),
      safe_tags: normalizeList(summary.safe_tags),
    };
  }

  function normalizeContinuitySummary(summary = {}) {
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      return {
        report_type: "",
        has_safe_account_number: false,
        has_safe_account_tag: false,
        has_masked_uidl_hint: false,
        delete_state: "",
        delete_finalized: false,
        recovery_state: "",
        shell_reopened: false,
        turd_package_needed: false,
        biff_watch_enabled: false,
        next_action_count: 0,
        email_body_present: false,
      };
    }

    return {
      report_type: normalizeText(summary.report_type),
      has_safe_account_number: normalizeBoolean(summary.has_safe_account_number),
      has_safe_account_tag: normalizeBoolean(summary.has_safe_account_tag),
      has_masked_uidl_hint: normalizeBoolean(summary.has_masked_uidl_hint),
      delete_state: normalizeText(summary.delete_state),
      delete_finalized: normalizeBoolean(summary.delete_finalized),
      recovery_state: normalizeText(summary.recovery_state),
      shell_reopened: normalizeBoolean(summary.shell_reopened),
      turd_package_needed: normalizeBoolean(summary.turd_package_needed),
      biff_watch_enabled: normalizeBoolean(summary.biff_watch_enabled),
      next_action_count: normalizeNumber(summary.next_action_count, 0),
      email_body_present: normalizeBoolean(summary.email_body_present),
    };
  }

  function normalizeSafeIdentifierRule(rule = {}) {
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
      return {
        allowed: [],
        blocked: [],
      };
    }

    return {
      allowed: normalizeList(rule.allowed),
      blocked: normalizeList(rule.blocked),
    };
  }

  function normalizeEmailHandoff(handoff = null) {
    if (!handoff || typeof handoff !== "object" || Array.isArray(handoff)) {
      return null;
    }

    return {
      handed_off_at: normalizeText(handoff.handed_off_at),
      provider_hint: normalizeText(handoff.provider_hint),
      message_id_hint: normalizeText(handoff.message_id_hint),
      status: normalizeText(handoff.status),
    };
  }

  function normalizeNextActions(actions) {
    if (!Array.isArray(actions)) {
      return [];
    }

    return actions.map((action) => {
      const cleanAction = action && typeof action === "object" && !Array.isArray(action)
        ? action
        : {};

      return {
        action_type: normalizeText(cleanAction.action_type),
        label: normalizeText(cleanAction.label),
        reference_tag: normalizeText(cleanAction.reference_tag),
        requires_human_approval: cleanAction.requires_human_approval !== false,
      };
    }).filter((action) => action.action_type && action.label);
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
    if (status.ledger_state === "blocked") {
      return "blocked";
    }

    if (status.ledger_state === "ready_for_email_handoff") {
      return "ready_for_email_handoff";
    }

    if (status.ledger_state === "email_handoff_recorded") {
      return "email_handoff_recorded";
    }

    return "unknown";
  }

  function buildDisplayCards(status) {
    if (status.net_state === "blocked") {
      return [
        {
          card_type: "CONTINUITY_REPORT_BLOCKED",
          headline: "Continuity report blocked",
          body: status.display_summary.body || "This continuity report is not enabled.",
          safe_status: "blocked",
          report_type: status.report_type,
        },
      ];
    }

    if (status.net_state === "ready_for_email_handoff") {
      const cards = [
        {
          card_type: "CONTINUITY_REPORT_READY",
          headline: status.display_summary.headline || "Continuity report ready",
          body: status.display_summary.body || "Safe account continuity report is ready for email handoff.",
          safe_status: "ready_for_email_handoff",
          report_type: status.report_type,
          subject: status.subject,
        },
      ];

      const referenceCard = buildSafeReferenceCard(status);

      if (referenceCard) {
        cards.push(referenceCard);
      }

      cards.push({
        card_type: "CONTINUITY_STATE",
        headline: "Continuity state",
        body: buildContinuityBody(status),
        safe_status: "continuity_state",
      });

      if (status.continuity_summary.turd_package_needed) {
        cards.push({
          card_type: "TURD_PACKAGE_NOTE",
          headline: "TURD package noted",
          body: "Dirty archive material is separated from active continuity.",
          safe_status: "turd_package_needed",
        });
      }

      if (status.continuity_summary.biff_watch_enabled) {
        cards.push({
          card_type: "BIFF_WATCH_NOTE",
          headline: "Biff watch active",
          body: "Biff is watching the continuity lane for recovery or finality concerns.",
          safe_status: "biff_watch_active",
        });
      }

      if (status.next_actions.length) {
        cards.push({
          card_type: "NEXT_ACTIONS",
          headline: "Next allowed actions",
          body: `${status.next_actions.length} safe action${status.next_actions.length === 1 ? "" : "s"} available.`,
          safe_status: "next_actions_available",
          action_count: status.next_actions.length,
        });
      }

      return cards;
    }

    if (status.net_state === "email_handoff_recorded") {
      return [
        {
          card_type: "EMAIL_HANDOFF_RECORDED",
          headline: "Continuity email handoff recorded",
          body: "Safe account continuity report handoff has been recorded.",
          safe_status: "email_handoff_recorded",
          provider_hint: status.email_handoff ? status.email_handoff.provider_hint : "",
        },
      ];
    }

    return [
      {
        card_type: "CONTINUITY_REPORT_UNKNOWN",
        headline: "Continuity report state unknown",
        body: "Continuity report status exists but does not match a known NET state.",
        safe_status: "unknown",
      },
    ];
  }

  function buildSafeReferenceCard(status) {
    const references = [];

    if (status.account_number) {
      references.push("account number");
    }

    if (status.account_tag) {
      references.push("account tag");
    }

    if (status.uidl_hint) {
      references.push("masked uIDL tag");
    }

    if (!references.length) {
      return null;
    }

    return {
      card_type: "SAFE_REFERENCES",
      headline: "Safe references present",
      body: `Email may identify the report with: ${references.join(", ")}.`,
      safe_status: "safe_references_only",
      reference_count: references.length,
    };
  }

  function buildContinuityBody(status) {
    const pieces = [];

    pieces.push(`delete: ${safeStatus(status.continuity_summary.delete_state)}`);
    pieces.push(`recovery: ${safeStatus(status.continuity_summary.recovery_state)}`);

    if (status.continuity_summary.delete_finalized) {
      pieces.push("delete finalized");
    }

    if (status.continuity_summary.shell_reopened) {
      pieces.push("shell reopened");
    }

    if (status.continuity_summary.turd_package_needed) {
      pieces.push("TURD package needed");
    }

    if (status.continuity_summary.biff_watch_enabled) {
      pieces.push("Biff watch");
    }

    return pieces.join(" · ");
  }

  function safeStatus(value) {
    const clean = normalizeText(value);

    if (!clean) {
      return "none";
    }

    return clean.replace(/_/g, " ");
  }

  function buildPaperLadderRow(status) {
    return {
      row_id: makeId("accountContinuityNetPaperRow"),
      report_id: status.report_id,
      received_at: status.received_at,
      report_type: status.report_type,
      net_state: status.net_state,
      has_safe_account_number: Boolean(status.account_number),
      has_safe_account_tag: Boolean(status.account_tag),
      has_masked_uidl_hint: Boolean(status.uidl_hint),
      delete_state: status.continuity_summary.delete_state,
      delete_finalized: status.continuity_summary.delete_finalized,
      recovery_state: status.continuity_summary.recovery_state,
      shell_reopened: status.continuity_summary.shell_reopened,
      turd_package_needed: status.continuity_summary.turd_package_needed,
      biff_watch_enabled: status.continuity_summary.biff_watch_enabled,
      next_action_count: status.next_actions.length,
      boundary: "NET_RECEIVES_ONLY_EMAIL_CAN_IDENTIFY_REPORT_NOT_PERSON",
    };
  }

  function listStatuses(filter = {}) {
    const cleanFilter = filter && typeof filter === "object" ? filter : {};
    const reportId = normalizeText(cleanFilter.report_id);
    const reportType = normalizeText(cleanFilter.report_type);
    const status = normalizeText(cleanFilter.status);
    const netState = normalizeText(cleanFilter.net_state);

    return receivedStatuses
      .filter((item) => {
        if (reportId && item.report_id !== reportId) {
          return false;
        }

        if (reportType && item.report_type !== reportType) {
          return false;
        }

        if (status && item.status !== status) {
          return false;
        }

        if (netState && item.net_state !== netState) {
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
  module.exports = AccountContinuityReportStatusReceiver;
}
