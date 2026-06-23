// magic-cursor-compliance.js
// CyberCrowd Magic Cursor — Compliance Core
// Owns: readiness checks before a device/session can enroll or operate.
// This answers: "Click → what do I need to run Magic Cursor?"
// Does not pair devices, transport events, move cursor, or grant OS control.

const MagicCursorCompliance = (() => {
  const STATUS_READY = "ready";
  const STATUS_BLOCKED = "blocked";
  const STATUS_LIMITED = "limited";

  const RESULT_PASS = "pass";
  const RESULT_FAIL = "fail";
  const RESULT_WARN = "warn";

  function now() {
    return new Date().toISOString();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function check({
    membershipActive = false,
    updateRequired = false,
    firstBondComplete = false,
    cableConnected = false,
    deviceCompatible = false,
    companionInstalled = false,
    roleSupported = false,
    privacyAccepted = false,
    operatorVerified = false
  } = {}) {
    const checks = [
      {
        id: "membership",
        label: "Membership active",
        result: membershipActive ? RESULT_PASS : RESULT_FAIL,
        message: membershipActive
          ? "Membership allows Magic Cursor."
          : "Magic Cursor requires an active membership or valid trial."
      },
      {
        id: "update",
        label: "Update status",
        result: updateRequired ? RESULT_FAIL : RESULT_PASS,
        message: updateRequired
          ? "Magic Cursor update is required before use."
          : "Magic Cursor is current enough to run."
      },
      {
        id: "first_bond",
        label: "Initial cable bond",
        result: firstBondComplete || cableConnected ? RESULT_PASS : RESULT_FAIL,
        message: firstBondComplete
          ? "Initial device bond already exists."
          : cableConnected
            ? "Cable detected for initial device bond."
            : "Connect cable for first trust bond."
      },
      {
        id: "device_compatible",
        label: "Device compatibility",
        result: deviceCompatible ? RESULT_PASS : RESULT_FAIL,
        message: deviceCompatible
          ? "Device can become an assigned surface."
          : "Device compatibility has not passed."
      },
      {
        id: "companion",
        label: "Companion installed",
        result: companionInstalled ? RESULT_PASS : RESULT_WARN,
        message: companionInstalled
          ? "Magic Cursor companion is installed."
          : "Companion may be needed to awaken dormant devices."
      },
      {
        id: "role_supported",
        label: "Surface role supported",
        result: roleSupported ? RESULT_PASS : RESULT_FAIL,
        message: roleSupported
          ? "Requested surface role is supported."
          : "Requested surface role is not supported by this device."
      },
      {
        id: "privacy",
        label: "Privacy rules accepted",
        result: privacyAccepted ? RESULT_PASS : RESULT_FAIL,
        message: privacyAccepted
          ? "Privacy rules accepted."
          : "Privacy rules must be accepted before deployment."
      },
      {
        id: "operator",
        label: "Operator verified",
        result: operatorVerified ? RESULT_PASS : RESULT_FAIL,
        message: operatorVerified
          ? "Operator authority verified."
          : "Operator authority must be verified."
      }
    ];

    const failures = checks.filter((item) => item.result === RESULT_FAIL);
    const warnings = checks.filter((item) => item.result === RESULT_WARN);

    const status = failures.length
      ? STATUS_BLOCKED
      : warnings.length
        ? STATUS_LIMITED
        : STATUS_READY;

    return clone({
      status,
      allowed: status !== STATUS_BLOCKED,
      checked_at: now(),
      summary: buildSummary(status, failures, warnings),
      checks
    });
  }

  function buildSummary(status, failures, warnings) {
    if (status === STATUS_READY) {
      return "Ready: Magic Cursor can run.";
    }

    if (status === STATUS_LIMITED) {
      return "Limited: Magic Cursor can run, but setup is missing optional support.";
    }

    return `Blocked: ${failures.length} required item${failures.length === 1 ? "" : "s"} missing.`;
  }

  function requiredActions(report) {
    if (!report || !Array.isArray(report.checks)) {
      throw new Error("Compliance report is required.");
    }

    return clone(
      report.checks
        .filter((item) => item.result === RESULT_FAIL || item.result === RESULT_WARN)
        .map((item) => ({
          id: item.id,
          label: item.label,
          result: item.result,
          action: item.message
        }))
    );
  }

  function requireReady(report) {
    if (!report || report.status === STATUS_BLOCKED) {
      throw new Error("Magic Cursor compliance blocked.");
    }

    return true;
  }

  return {
    check,
    requiredActions,
    requireReady
  };
})();

if (typeof window !== "undefined") {
  window.MagicCursorCompliance = MagicCursorCompliance;
}

export default MagicCursorCompliance;
